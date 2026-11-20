/* File ingestion (.xlsx / .xls / .csv / .txt) and report export (.xlsx / .csv / .txt). Everything runs in the browser. */
import Papa from "papaparse";
import { downloadBlob } from "../lib/files";
import type { ColumnPair, Dataset, ReconConfig, ReconResult, ResultRow } from "./recon-engine";

export type Delim = "auto" | "," | "\t" | "|" | ";";
export const DELIMS: [Delim, string][] = [["auto", "Auto-detect"], [",", "Comma ( , )"], ["\t", "Tab"], ["|", "Pipe ( | )"], [";", "Semicolon ( ; )"]];
export const delimName = (d?: string) => DELIMS.find(([v]) => v === d)?.[1].replace(/ \(.*\)/, "") ?? (d ? `"${d}"` : "–");

export interface ParseOpts { delimiter: Delim; sheet: string; header: boolean }
export const defaultOpts = (): ParseOpts => ({ delimiter: "auto", sheet: "", header: true });

/** A parsed dataset plus how it was read (for the preview card and re-parsing). */
export interface LoadedDataset extends Dataset {
  kind: "excel" | "text";
  opts: ParseOpts;
  sheets: string[];
  detected: string;   // delimiter used / sheet read
  size: number;
}

export const ACCEPT = [".xlsx", ".xls", ".csv", ".txt"];
export const MAX_MB = 100;
export const isExcel = (name: string) => /\.xlsx?$/i.test(name);

/** Excel dates -> YYYY-MM-DD, everything else -> text exactly as stored. */
const cellText = (v: unknown): string => {
  if (v instanceof Date) {
    const d = new Date(v.getTime() - v.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 10);
  }
  return v == null ? "" : String(v);
};

/** Header row -> unique, non-blank names; rows padded to the same width; blank rows dropped. */
function shape(aoa: string[][], header: boolean): { headers: string[]; rows: string[][] } {
  const data = aoa.filter((r) => r.some((c) => String(c ?? "").trim() !== ""));
  const width = data.reduce((w, r) => Math.max(w, r.length), 0);
  const first = header ? data[0] ?? [] : [];
  const seen = new Map<string, number>();
  const headers = Array.from({ length: width }, (_, i) => {
    let h = String(first[i] ?? "").trim() || `Column ${i + 1}`;
    const n = (seen.get(h) ?? 0) + 1;
    seen.set(h, n);
    if (n > 1) h = `${h} (${n})`;
    return h;
  });
  const rows = (header ? data.slice(1) : data).map((r) => Array.from({ length: width }, (_, i) => cellText(r[i])));
  return { headers, rows };
}

export async function parseFile(file: File, opts: ParseOpts): Promise<LoadedDataset> {
  if (!ACCEPT.some((e) => file.name.toLowerCase().endsWith(e))) throw new Error(`Unsupported file type. Use ${ACCEPT.join(", ")}`);
  if (file.size > MAX_MB * 1024 * 1024) throw new Error(`File is larger than ${MAX_MB} MB`);
  if (isExcel(file.name)) {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
    // default: the sheet with the most cells (skips cover / notes sheets)
    const cells = (n: string) => { const ref = wb.Sheets[n]?.["!ref"]; if (!ref) return 0; const r = XLSX.utils.decode_range(ref); return (r.e.r - r.s.r + 1) * (r.e.c - r.s.c + 1); };
    const biggest = wb.SheetNames.reduce((m, n) => (cells(n) > cells(m) ? n : m), wb.SheetNames[0]);
    const sheet = opts.sheet && wb.SheetNames.includes(opts.sheet) ? opts.sheet : biggest;
    const aoa = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheet], { header: 1, raw: true, defval: "" }) as unknown as string[][];
    const { headers, rows } = shape(aoa, opts.header);
    return { fileName: file.name, headers, rows, kind: "excel", opts: { ...opts, sheet }, sheets: wb.SheetNames, detected: sheet, size: file.size };
  }
  const text = (await file.text()).replace(/^﻿/, "");
  const res = Papa.parse<string[]>(text, {
    delimiter: opts.delimiter === "auto" ? "" : opts.delimiter,
    delimitersToGuess: [",", "\t", "|", ";"],
    skipEmptyLines: "greedy",
  });
  const bad = res.errors.find((e) => e.type === "Quotes");
  if (!res.data.length) throw new Error("The file is empty");
  if (bad && res.data.length < 2) throw new Error(`Could not parse: ${bad.message}`);
  const { headers, rows } = shape(res.data, opts.header);
  return { fileName: file.name, headers, rows, kind: "text", opts, sheets: [], detected: res.meta.delimiter, size: file.size };
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

export type ExportFormat = "xlsx" | "csv" | "txt";
export interface ExportOpts { format: ExportFormat; delimiter: string; allColumns: boolean; scopeLabel: string }

const pairCols = (p: ColumnPair) => [`A: ${p.colA}`, `B: ${p.colB}`];

/** Detail table: Status, Key, Mismatch_Reason, source row numbers, mapped values side by side (+ optionally every source column). */
export function detailTable(rows: ResultRow[], A: Dataset, B: Dataset, cfg: ReconConfig, allColumns: boolean) {
  const off = 2; // data row 1 is spreadsheet row 2 (header in row 1)
  const iA = (c: string) => A.headers.indexOf(c), iB = (c: string) => B.headers.indexOf(c);
  const heads = [
    "Status", "Key", "Mismatch_Reason", "Row_A", "Row_B",
    ...cfg.keys.flatMap(pairCols),
    ...cfg.compares.flatMap((c) => [...pairCols(c), `${c.label || c.colA}_Result`]),
    ...(allColumns ? [...A.headers.map((h) => `A.${h}`), ...B.headers.map((h) => `B.${h}`)] : []),
  ];
  const data = rows.map((r) => {
    const ra = r.ai >= 0 ? A.rows[r.ai] : null, rb = r.bi >= 0 ? B.rows[r.bi] : null;
    const val = (row: string[] | null, i: number) => (row && i >= 0 ? row[i] ?? "" : "");
    const both = r.ai >= 0 && r.bi >= 0;
    return [
      r.status, r.key, r.reason, r.ai >= 0 ? String(r.ai + off) : "", r.bi >= 0 ? String(r.bi + off) : "",
      ...cfg.keys.flatMap((k) => [val(ra, iA(k.colA)), val(rb, iB(k.colB))]),
      ...cfg.compares.flatMap((c) => [val(ra, iA(c.colA)), val(rb, iB(c.colB)), both ? (r.diffs.includes(c.id) ? "Mismatch" : "Match") : ""]),
      ...(allColumns ? [...A.headers.map((_, i) => val(ra, i)), ...B.headers.map((_, i) => val(rb, i))] : []),
    ];
  });
  return { heads, data };
}

const stamp = () => new Date().toISOString().slice(0, 16).replace(/\D/g, "");

export async function exportReport(rows: ResultRow[], A: Dataset, B: Dataset, res: ReconResult, o: ExportOpts) {
  const cfg = res.config;
  const { heads, data } = detailTable(rows, A, B, cfg, o.allColumns);
  const base = `recon_${o.scopeLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${stamp()}`;
  if (o.format !== "xlsx") {
    const delimiter = o.format === "csv" ? "," : o.delimiter || "\t";
    const text = Papa.unparse({ fields: heads, data }, { delimiter, newline: "\r\n" });
    downloadBlob(`${base}.${o.format}`, "﻿" + text, o.format === "csv" ? "text/csv;charset=utf-8" : "text/plain;charset=utf-8");
    return `${base}.${o.format}`;
  }
  const XLSX = await import("xlsx");
  const s = res.summary;
  const pct = (n: number) => (s.totalA ? `${((n / s.totalA) * 100).toFixed(1)}%` : "–");
  const summary: (string | number)[][] = [
    ["2-Way Reconciliation Report"], [],
    ["Run at", new Date(res.at).toLocaleString("en-IN")],
    ["Dataset A (Source)", res.fileA], ["Dataset B (Target)", res.fileB],
    ["Rows in this export", data.length, o.scopeLabel], [],
    ["Metric", "Count", "% of Dataset A"],
    ["Total Records A", s.totalA, ""], ["Total Records B", s.totalB, ""],
    ["Exact Matches", s.matched, pct(s.matched)], ["Field Mismatches", s.mismatched, pct(s.mismatched)],
    ["Missing in B (only in A)", s.missingInB, pct(s.missingInB)], ["Missing in A (only in B)", s.missingInA, ""],
    ["Duplicate-key rows", s.duplicateRows, ""], ["Duplicate keys in A", s.dupKeysA, ""], ["Duplicate keys in B", s.dupKeysB, ""], ["Blank keys", s.blankKeys, ""],
    [], ["Mismatches by field", "Rows"],
    ...cfg.compares.map((c) => [c.label || c.colA, s.fieldCounts[c.id] ?? 0]),
  ];
  const mapping: string[][] = [
    ["Role", "Label", "Dataset A column", "Dataset B column", "Type", "Rules A", "Rules B", "Decimals", "Tolerance"],
    ...[...cfg.keys.map((p) => ["Key", p] as const), ...cfg.compares.map((p) => ["Compare", p] as const)].map(([role, p]) => [
      role, p.label, p.colA, p.colB, p.type, ruleText(p, "a"), ruleText(p, "b"), p.decimals === null ? "" : String(p.decimals), p.type === "number" && role === "Compare" ? String(p.tolerance) : "",
    ]),
  ];
  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(summary); ws1["!cols"] = [{ wch: 30 }, { wch: 28 }, { wch: 16 }];
  const ws2 = XLSX.utils.aoa_to_sheet([heads, ...data]);
  ws2["!cols"] = heads.map((h, i) => ({ wch: i === 2 ? 80 : Math.min(40, Math.max(12, h.length + 2)) }));
  ws2["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: data.length, c: heads.length - 1 } }) };
  const ws3 = XLSX.utils.aoa_to_sheet(mapping); ws3["!cols"] = mapping[0].map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, ws1, "Summary");
  XLSX.utils.book_append_sheet(wb, ws2, "Detail");
  XLSX.utils.book_append_sheet(wb, ws3, "Mapping");
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  downloadBlob(`${base}.xlsx`, out, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  return `${base}.xlsx`;
}

/** One-line description of the normalisation applied to one side of a pair. */
export function ruleText(p: ColumnPair, side: "a" | "b"): string {
  const r = p[side];
  if (p.type === "number") {
    return [r.stripCurrency ? "strip ₹/commas" : "plain number", p.decimals !== null ? `round ${p.decimals} dp` : "", p.tolerance ? `±${p.tolerance}` : ""].filter(Boolean).join(", ");
  }
  if (p.type === "date") return { auto: "auto-detect", DMY: "DD/MM/YYYY", MDY: "MM/DD/YYYY", YMD: "YYYY-MM-DD", YYYYMMDD: "YYYYMMDD", EXCEL: "Excel serial" }[r.dateFormat] + " → ISO";
  return [r.trim && "trim", r.caseMode === "upper" ? "ignore case" : r.caseMode === "lower" ? "lower case" : "case-sensitive", r.stripSpecial && "no special chars", r.stripLeadingZeros && "no leading zeros"].filter(Boolean).join(", ");
}

/* ------------------------------------------------------------------ */
/* Mapping templates (.json)                                           */
/* ------------------------------------------------------------------ */

export interface MappingTemplate {
  app: "2-way-recon";
  kind: "mapping-template";
  version: 1;
  id: string;
  name: string;
  savedAt: string;
  headersA: string[];
  headersB: string[];
  config: ReconConfig;
}

export function downloadTemplate(t: MappingTemplate) {
  downloadBlob(`${t.name.replace(/[^\w-]+/g, "_") || "mapping"}.recon.json`, JSON.stringify(t, null, 2), "application/json");
}

/** Validates an uploaded template file. Throws a readable error when the file is not a mapping template. */
export async function readTemplate(file: File): Promise<MappingTemplate> {
  let j: Partial<MappingTemplate>;
  try { j = JSON.parse(await file.text()); } catch { throw new Error("Not a valid JSON file"); }
  const c = j?.config;
  if (j?.kind !== "mapping-template" || !c || !Array.isArray(c.keys) || !Array.isArray(c.compares)) throw new Error("This JSON is not a 2-Way Recon mapping template");
  const okPair = (p: ColumnPair) => p && typeof p.colA === "string" && typeof p.colB === "string" && ["text", "number", "date"].includes(p.type) && p.a && p.b;
  if (![...c.keys, ...c.compares].every(okPair)) throw new Error("Template has malformed column mappings");
  return {
    app: "2-way-recon", kind: "mapping-template", version: 1,
    id: j.id || crypto.randomUUID(), name: j.name || file.name.replace(/\.(recon\.)?json$/i, ""), savedAt: j.savedAt || new Date().toISOString(),
    headersA: j.headersA ?? [], headersB: j.headersB ?? [], config: { version: 1, keys: c.keys, compares: c.compares },
  };
}

/** Columns referenced by a config that do not exist in the loaded files. */
export function missingColumns(cfg: ReconConfig, A: Dataset | null, B: Dataset | null): string[] {
  const out: string[] = [];
  for (const p of [...cfg.keys, ...cfg.compares]) {
    if (A && p.colA && !A.headers.includes(p.colA)) out.push(`A: ${p.colA}`);
    if (B && p.colB && !B.headers.includes(p.colB)) out.push(`B: ${p.colB}`);
  }
  return [...new Set(out)];
}
