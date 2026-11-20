/* CSV / file helpers (export, template download, upload parsing). */

const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function downloadBlob(name: string, data: BlobPart, type: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function downloadCsv(name: string, heads: string[], rows: (string | number)[][]) {
  // BOM so Excel opens UTF-8 (–, ’) correctly
  const text = "﻿" + [heads, ...rows].map((r) => r.map(q).join(",")).join("\r\n");
  downloadBlob(name, text, "text/csv;charset=utf-8");
}

export function parseCsv(txt: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cur = "", inQ = false;
  txt = txt.replace(/^﻿/, "");
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (inQ) {
      if (c === '"' && txt[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && txt[i + 1] === "\n") i++;
      row.push(cur); rows.push(row); row = []; cur = "";
    } else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

/** Excel serial date or Date → YYYY-MM-DD; strings are passed through. */
const cellToText = (v: unknown): string => {
  if (v instanceof Date) {
    const d = new Date(v.getTime() - v.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 10);
  }
  return String(v ?? "").trim();
};

/** Reads the first sheet of an .xlsx / .xls / .csv file into rows of text. Excel support is lazy-loaded. */
export async function readSheet(file: File): Promise<string[][]> {
  if (/\.csv$/i.test(file.name)) return parseCsv(await file.text());
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: "" });
  return rows.map((r) => r.map(cellToText)).filter((r) => r.some((c) => c));
}

/** Builds an .xlsx workbook with one sheet. */
export async function downloadXlsx(name: string, heads: string[], rows: string[][], sheet = "Sheet1") {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([heads, ...rows]);
  ws["!cols"] = heads.map((h) => ({ wch: Math.max(14, h.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  downloadBlob(name, out, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}
