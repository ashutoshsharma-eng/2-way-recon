/* Reconciliation engine — pure TypeScript (no React, no DOM, no imports) so it runs in the Web Worker, on the main thread
   as a fallback, and under Node for the engine tests (scripts/test-engine.mjs). */

export type DataType = "text" | "number" | "date";
export type CaseMode = "none" | "upper" | "lower";
/** Order of day / month / year in the source text. Separators (/ - . space) are ignored; month names are always understood. */
export type DateFormat = "auto" | "DMY" | "MDY" | "YMD" | "YYYYMMDD" | "EXCEL";

/** Normalisation applied to ONE side (Dataset A or Dataset B) of a mapped column pair before matching. */
export interface SideRule {
  trim: boolean;              // text: trim + collapse inner whitespace
  caseMode: CaseMode;         // text: compare in UPPER / lower case
  stripSpecial: boolean;      // text: remove everything except letters, digits and spaces
  stripLeadingZeros: boolean; // text: "000123" -> "123"
  stripCurrency: boolean;     // number: remove ₹ $ € £, INR/Rs, thousands separators
  dateFormat: DateFormat;     // date: how the source text is written
}

export interface ColumnPair {
  id: string;
  label: string;        // used in Mismatch_Reason ("Pin Code mismatch …")
  colA: string;         // header in Dataset A
  colB: string;         // header in Dataset B
  type: DataType;
  a: SideRule;
  b: SideRule;
  decimals: number | null; // number: round both sides before comparing (null = no rounding)
  tolerance: number;       // number: |A − B| <= tolerance counts as equal
}

export interface ReconConfig { version: 1; keys: ColumnPair[]; compares: ColumnPair[] }

export interface Dataset {
  fileName: string;
  headers: string[];
  rows: string[][];
}

export type Status = "Matched" | "Field Mismatch" | "Missing in B" | "Missing in A" | "Duplicate Key";
export const STATUSES: Status[] = ["Matched", "Field Mismatch", "Missing in B", "Missing in A", "Duplicate Key"];

export interface ResultRow {
  n: number;          // sequence in the report
  status: Status;
  key: string;        // normalised (composite) key, parts joined with " | "
  ai: number;         // row index in Dataset A (-1 = none)
  bi: number;         // row index in Dataset B (-1 = none)
  diffs: string[];    // ids of compare pairs that differ
  reason: string;     // human-readable Mismatch_Reason ("" for exact matches)
}

export interface Summary {
  totalA: number;
  totalB: number;
  matched: number;
  mismatched: number;
  missingInA: number;
  missingInB: number;
  duplicateRows: number;
  dupKeysA: number;
  dupKeysB: number;
  blankKeys: number;
  matchPct: number;                     // exact matches as % of Dataset A records
  fieldCounts: Record<string, number>;  // compare pair id -> mismatching rows
  ms: number;
}

export interface ReconResult { rows: ResultRow[]; summary: Summary; at: string; config: ReconConfig; fileA: string; fileB: string }

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

export const defaultRule = (type: DataType = "text"): SideRule => ({
  trim: true,
  caseMode: type === "text" ? "upper" : "none",
  stripSpecial: false,
  stripLeadingZeros: false,
  stripCurrency: true,
  dateFormat: "auto",
});

export const emptyConfig = (): ReconConfig => ({ version: 1, keys: [], compares: [] });

/* ------------------------------------------------------------------ */
/* Normalisation                                                       */
/* ------------------------------------------------------------------ */

/** Normalised value: `v` is the canonical text used for keys / equality, `num` is set for valid numbers. */
export interface Norm { v: string; num?: number; ok: boolean }

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

function isoOf(y: number, m: number, d: number): string | null {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1000 || y > 9999) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null; // e.g. 31/02
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
}

const year = (s: string) => { const y = Number(s); return s.length <= 2 ? (y < 50 ? 2000 + y : 1900 + y) : y; };

/** Excel serial day number (1900 date system) -> ISO date. */
export function excelSerialToIso(n: number): string | null {
  if (!isFinite(n) || n < 1 || n > 2958465) return null;
  const dt = new Date(Date.UTC(1899, 11, 30) + Math.floor(n) * 864e5);
  return isoOf(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/** Parses a date written in `fmt` (or auto-detected) to YYYY-MM-DD. Returns null when it cannot be read. */
export function parseDate(raw: string, fmt: DateFormat): string | null {
  let s = raw.trim();
  if (!s) return null;
  if (fmt === "EXCEL" || (fmt === "auto" && /^\d{5}(\.\d+)?$/.test(s))) return excelSerialToIso(Number(s));
  if (fmt === "YYYYMMDD" || (fmt === "auto" && /^\d{8}$/.test(s))) {
    if (!/^\d{8}$/.test(s)) return null;
    return isoOf(Number(s.slice(0, 4)), Number(s.slice(4, 6)), Number(s.slice(6, 8)));
  }
  s = s.replace(/[T\s]+\d{1,2}:\d{2}(:\d{2}(\.\d+)?)?\s*(am|pm)?\s*(z|[+-]\d{2}:?\d{2})?$/i, ""); // drop a time part
  const t = s.split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (t.length !== 3) return null;
  const mi = t.findIndex((x) => /[a-z]/i.test(x));
  if (mi >= 0) {
    const m = MONTHS[t[mi].toLowerCase()] ?? MONTHS[t[mi].slice(0, 3).toLowerCase()];
    const nums = t.filter((_, i) => i !== mi);
    if (!m || nums.some((x) => !/^\d+$/.test(x))) return null;
    return nums[0].length === 4 ? isoOf(Number(nums[0]), m, Number(nums[1])) : isoOf(year(nums[1]), m, Number(nums[0]));
  }
  if (t.some((x) => !/^\d+$/.test(x))) return null;
  const [p, q, r] = t;
  let order = fmt;
  if (order === "auto") order = p.length === 4 ? "YMD" : Number(p) > 12 ? "DMY" : Number(q) > 12 ? "MDY" : "DMY";
  if (order === "YMD") return isoOf(year(p), Number(q), Number(r));
  if (order === "MDY") return isoOf(year(r), Number(p), Number(q));
  return isoOf(year(r), Number(q), Number(p)); // DMY
}

/** Rounds half away from zero without binary drift (1.005 -> 1.01). */
export function round(x: number, dp: number): number {
  const a = Math.abs(x);
  const s = String(a);
  const r = s.includes("e") ? Math.round(a * 10 ** dp) / 10 ** dp : Number(Math.round(Number(`${s}e${dp}`)) + `e-${dp}`);
  return x < 0 ? -r : r;
}

/** Reads a number from text: "₹1,50,000.50", "(1,200)", "1200-", "USD 45" (when stripCurrency), "12345". */
export function parseNumber(raw: string, stripCurrency: boolean): number | null {
  let s = raw.trim();
  if (!s) return null;
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1).trim(); }
  if (stripCurrency) s = s.replace(/[₹$€£¥]|INR|USD|EUR|GBP|Rs\.?/gi, "").replace(/[,\s'_]/g, "");
  if (/-$/.test(s)) { neg = !neg; s = s.slice(0, -1); }
  if (!/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s)) return null;
  const n = Number(s);
  if (!isFinite(n)) return null;
  return neg ? -n : n;
}

export function normalize(raw: unknown, type: DataType, rule: SideRule, decimals: number | null = null): Norm {
  const s0 = raw == null ? "" : String(raw);
  if (type === "number") {
    if (!s0.trim()) return { v: "", ok: true };
    const n = parseNumber(s0, rule.stripCurrency);
    if (n === null) return { v: s0.trim(), ok: false };
    const x = decimals === null ? n : round(n, decimals);
    const fixed = x === 0 ? 0 : x; // no "-0"
    return { v: String(fixed), num: fixed, ok: true };
  }
  if (type === "date") {
    if (!s0.trim()) return { v: "", ok: true };
    const iso = parseDate(s0, rule.dateFormat);
    return iso ? { v: iso, ok: true } : { v: s0.trim(), ok: false };
  }
  let s = s0;
  if (rule.trim) s = s.trim().replace(/\s+/g, " ");
  if (rule.stripSpecial) s = s.replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
  if (rule.stripLeadingZeros) s = s.replace(/^0+(?=.)/, "");
  if (rule.caseMode === "upper") s = s.toUpperCase();
  else if (rule.caseMode === "lower") s = s.toLowerCase();
  return { v: s, ok: true };
}

export function sameValue(a: Norm, b: Norm, type: DataType, tolerance: number): boolean {
  if (type === "number" && a.num !== undefined && b.num !== undefined) return Math.abs(a.num - b.num) <= Math.abs(tolerance) + 1e-9;
  return a.v === b.v;
}

/* ------------------------------------------------------------------ */
/* Matching                                                            */
/* ------------------------------------------------------------------ */

const show = (raw: string, n: Norm, type: DataType) => {
  const t = raw.trim();
  if (!t) return "(blank)";
  return n.ok ? t : `${t} [invalid ${type}]`;
};
const fmtDiff = (x: number) => String(round(x, 6));

/** Column index lookups; throws a readable error when a mapped column is missing from the file. */
function indexes(ds: Dataset, cols: string[], side: "A" | "B"): number[] {
  return cols.map((c) => {
    const i = ds.headers.indexOf(c);
    if (i < 0) throw new Error(`Column "${c}" not found in Dataset ${side} (${ds.fileName})`);
    return i;
  });
}

export function validateConfig(cfg: ReconConfig): string[] {
  const errs: string[] = [];
  if (!cfg.keys.length) errs.push("Map at least one key column");
  [...cfg.keys, ...cfg.compares].forEach((p, i) => {
    if (!p.colA || !p.colB) errs.push(`Row ${i + 1}: choose a column on both sides`);
    if (p.type === "number" && !(p.tolerance >= 0)) errs.push(`${p.label || p.colA}: tolerance must be 0 or more`);
  });
  return errs;
}

export function reconcile(A: Dataset, B: Dataset, cfg: ReconConfig): ReconResult {
  const t0 = Date.now();
  const errs = validateConfig(cfg);
  if (errs.length) throw new Error(errs.join("; "));
  const kA = indexes(A, cfg.keys.map((k) => k.colA), "A");
  const kB = indexes(B, cfg.keys.map((k) => k.colB), "B");
  const cA = indexes(A, cfg.compares.map((c) => c.colA), "A");
  const cB = indexes(B, cfg.compares.map((c) => c.colB), "B");

  const keyOf = (row: string[], idx: number[], side: "a" | "b") =>
    cfg.keys.map((k, i) => normalize(row[idx[i]], k.type, k[side], k.decimals).v).join(" | ");
  const blank = (key: string) => key.split(" | ").every((p) => p === "");

  const keysA = A.rows.map((r) => keyOf(r, kA, "a"));
  const keysB = B.rows.map((r) => keyOf(r, kB, "b"));
  const group = (keys: string[]) => {
    const m = new Map<string, number[]>();
    keys.forEach((k, i) => { if (!blank(k)) { const l = m.get(k); if (l) l.push(i); else m.set(k, [i]); } });
    return m;
  };
  const mA = group(keysA);
  const mB = group(keysB);

  const out: ResultRow[] = [];
  const fieldCounts: Record<string, number> = Object.fromEntries(cfg.compares.map((c) => [c.id, 0]));
  let blankKeys = 0;
  const push = (r: Omit<ResultRow, "n">) => out.push({ n: out.length + 1, ...r });
  const dupReason = (k: string, a: number, b: number) =>
    `Duplicate key [${k}]: ${a}× in Dataset A, ${b}× in Dataset B — excluded from matching`;

  keysA.forEach((key, ai) => {
    if (blank(key)) { blankKeys++; push({ status: "Missing in B", key: "", ai, bi: -1, diffs: [], reason: "Key is blank in Dataset A" }); return; }
    const la = mA.get(key)!;
    const lb = mB.get(key);
    if (la.length > 1 || (lb && lb.length > 1)) { push({ status: "Duplicate Key", key, ai, bi: -1, diffs: [], reason: dupReason(key, la.length, lb?.length ?? 0) }); return; }
    if (!lb) { push({ status: "Missing in B", key, ai, bi: -1, diffs: [], reason: `Key [${key}] missing in Dataset B` }); return; }
    const bi = lb[0];
    const ra = A.rows[ai], rb = B.rows[bi];
    const diffs: string[] = [];
    const reasons: string[] = [];
    cfg.compares.forEach((c, i) => {
      const va = ra[cA[i]] ?? "", vb = rb[cB[i]] ?? "";
      const na = normalize(va, c.type, c.a, c.decimals), nb = normalize(vb, c.type, c.b, c.decimals);
      if (sameValue(na, nb, c.type, c.tolerance)) return;
      diffs.push(c.id);
      fieldCounts[c.id]++;
      const delta = na.num !== undefined && nb.num !== undefined ? `, diff ${fmtDiff(nb.num - na.num)}` : "";
      reasons.push(`${c.label || c.colA} mismatch (File A: ${show(va, na, c.type)} vs File B: ${show(vb, nb, c.type)}${delta})`);
    });
    push({ status: diffs.length ? "Field Mismatch" : "Matched", key, ai, bi, diffs, reason: reasons.join("; ") });
  });

  keysB.forEach((key, bi) => {
    if (blank(key)) { blankKeys++; push({ status: "Missing in A", key: "", ai: -1, bi, diffs: [], reason: "Key is blank in Dataset B" }); return; }
    const lb = mB.get(key)!;
    const la = mA.get(key);
    if (lb.length > 1 || (la && la.length > 1)) { push({ status: "Duplicate Key", key, ai: -1, bi, diffs: [], reason: dupReason(key, la?.length ?? 0, lb.length) }); return; }
    if (!la) push({ status: "Missing in A", key, ai: -1, bi, diffs: [], reason: `Key [${key}] missing in Dataset A` });
    // otherwise already paired while walking Dataset A
  });

  const count = (s: Status) => out.filter((r) => r.status === s).length;
  const matched = count("Matched");
  const summary: Summary = {
    totalA: A.rows.length,
    totalB: B.rows.length,
    matched,
    mismatched: count("Field Mismatch"),
    missingInA: count("Missing in A"),
    missingInB: count("Missing in B"),
    duplicateRows: count("Duplicate Key"),
    dupKeysA: [...mA.values()].filter((l) => l.length > 1).length,
    dupKeysB: [...mB.values()].filter((l) => l.length > 1).length,
    blankKeys,
    matchPct: A.rows.length ? (matched / A.rows.length) * 100 : 0,
    fieldCounts,
    ms: Date.now() - t0,
  };
  return { rows: out, summary, at: new Date().toISOString(), config: cfg, fileA: A.fileName, fileB: B.fileName };
}

/* ------------------------------------------------------------------ */
/* Auto-mapping helpers                                                */
/* ------------------------------------------------------------------ */

const SYN: Record<string, string> = {
  cust: "customer", client: "customer", customers: "customer", acct: "account", ac: "account", amt: "amount", total: "amount", value: "amount",
  pin: "postal", pincode: "postal", zip: "postal", zipcode: "postal", postcode: "postal", dt: "date", inv: "invoice", no: "id", num: "id",
  number: "id", nbr: "id", ref: "reference", qty: "quantity", desc: "description", stat: "status", nm: "name",
};
const STOP = new Set(["the", "of", "a", "an", "in", "order", "code"]);

export function nameTokens(h: string): string[] {
  const t = h.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map((x) => SYN[x] ?? x);
  const keep = t.filter((x) => !STOP.has(x));
  return keep.length ? keep : t;
}

export function nameScore(a: string, b: string): number {
  if (a.toLowerCase().replace(/[^a-z0-9]/g, "") === b.toLowerCase().replace(/[^a-z0-9]/g, "")) return 1;
  const A = new Set(nameTokens(a)), B = new Set(nameTokens(b));
  const inter = [...A].filter((x) => B.has(x)).length;
  return inter / new Set([...A, ...B]).size;
}

/** Guesses text / number / date from sample values. Long digit strings (> 15 digits) stay text to avoid precision loss. */
export function guessType(values: string[]): DataType {
  const v = values.map((x) => x.trim()).filter(Boolean).slice(0, 50);
  if (!v.length) return "text";
  if (v.every((x) => /[/\-.\s]/.test(x) && /\d/.test(x) && parseDate(x, "auto") !== null && !/^[+-]?\d+(\.\d+)?$/.test(x))) return "date";
  if (v.every((x) => parseNumber(x, true) !== null && x.replace(/\D/g, "").length <= 15)) return "number";
  return "text";
}

/** Guesses day/month order from sample dates. */
export function guessDateFormat(values: string[]): DateFormat {
  let dmy = false, mdy = false, ymd = false;
  for (const x of values.slice(0, 200)) {
    const t = x.trim().split(/[^A-Za-z0-9]+/).filter(Boolean);
    if (t.length < 3 || t.some((p) => /[a-z]/i.test(p))) continue;
    if (t[0].length === 4) ymd = true;
    else if (Number(t[0]) > 12) dmy = true;
    else if (Number(t[1]) > 12) mdy = true;
  }
  return ymd ? "YMD" : mdy && !dmy ? "MDY" : dmy ? "DMY" : "auto";
}
