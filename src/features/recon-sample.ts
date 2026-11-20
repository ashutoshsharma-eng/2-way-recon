/* "Load Sample Data": two realistic exports of the same customer invoices from two systems, with the usual formatting noise
   (zero-padded text IDs vs numeric IDs, ₹ amounts with Indian grouping vs plain numbers, DD/MM/YYYY vs ISO dates, upper-case names,
   trailing spaces) plus planted discrepancies. Self-contained (type-only imports) so scripts/test-engine.mjs can load it in Node. */
import type { ColumnPair, ReconConfig, SideRule } from "./recon-engine";

const FIRST = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Rohan", "Ananya", "Diya", "Saanvi", "Aadhya", "Kavya", "Meera", "Priya", "Neha", "Riya", "Tara"];
const LAST = ["Sharma", "Mehta", "Iyer", "Patel", "Reddy", "Nair", "Gupta", "Kulkarni", "Desai", "Joshi", "Rao", "Shah", "Menon", "Kapoor", "Bose"];
const PINS = [400001, 400050, 400059, 400069, 400076, 400093, 400101, 411001, 560001, 110001, 600001, 500081];
const STATUS = ["Paid", "Pending", "Overdue", "Paid", "Paid"];

const pad = (n: number, w = 2) => String(n).padStart(w, "0");
const inrText = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const q = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

interface Inv { id: number; name: string; pin: number; amount: number; y: number; m: number; d: number; status: string }

function base(): Inv[] {
  const out: Inv[] = [];
  for (let i = 0; i < 60; i++) {
    out.push({
      id: 1001 + i,
      name: `${FIRST[(i * 7) % FIRST.length]} ${LAST[(i * 4) % LAST.length]}`,
      pin: PINS[(i * 5) % PINS.length],
      amount: Math.round(((i * 7919) % 250000) + 1200 + (i % 4) * 0.25 * 100) / 1 + (i % 3 === 0 ? 0.5 : 0),
      y: 2026, m: 1 + (i % 10), d: 1 + ((i * 3) % 28),
      status: STATUS[i % STATUS.length],
    });
  }
  return out;
}

/** Dataset A — "Finance Ledger" (comma CSV). */
export function sampleA(): string {
  const rows = base();
  rows[3] = { ...rows[3], pin: 400059, amount: 1500 };            // B: pin 400082, amount 1450
  rows.splice(36, 0, { ...rows[35], amount: rows[35].amount + 10 }); // duplicate key 1036 in A
  const head = ["customer id", "Customer Name", "Pin Code", "Amount", "Invoice Date", "Status"];
  const lines = rows.map((r) => [pad(r.id, 6), r.name, String(r.pin), inrText(r.amount), `${pad(r.d)}/${pad(r.m)}/${r.y}`, r.status].map(q).join(","));
  return [head.join(","), ...lines].join("\r\n");
}

/** Dataset B — "Billing System Export" (pipe-delimited TXT). */
export function sampleB(): string {
  const rows = base().map((r) => ({ ...r }));
  rows[3].pin = 400082; rows[3].amount = 1450;                     // pin + amount mismatch
  rows[7].amount = +(rows[7].amount + 0.004).toFixed(3);           // inside ±0.01 tolerance -> still a match
  rows[11].status = rows[11].status === "Paid" ? "Overdue" : "Paid"; // status mismatch
  rows[15].d = rows[15].d === 28 ? 27 : rows[15].d + 1;            // date mismatch
  rows[19].amount = rows[19].amount + 250;                         // amount mismatch
  rows[42].name = rows[42].name.replace(/a/, "e");                 // name typo
  const dup = { ...rows[30] };                                     // duplicate key 1031 in B
  const kept = rows.filter((_, i) => i !== 23 && i !== 24);        // 1024, 1025 missing in B
  kept.splice(29, 0, dup);
  kept.push(
    { id: 2001, name: "Zoya Khan", pin: 400053, amount: 8800, y: 2026, m: 3, d: 14, status: "Pending" },
    { id: 2002, name: "Kabir Singh", pin: 110017, amount: 12450.75, y: 2026, m: 4, d: 2, status: "Paid" },
    { id: 2003, name: "Ira Malhotra", pin: 560034, amount: 3100, y: 2026, m: 5, d: 21, status: "Overdue" },
  );
  const head = ["Cust_ID", "Client_Name", "Postal_Code", "Invoice_Total", "Inv_Date", "Order_Status"];
  const lines = kept.map((r, i) => [
    String(r.id), r.name.toUpperCase(), String(r.pin), String(r.amount),
    `${r.y}-${pad(r.m)}-${pad(r.d)}`, r.status.toUpperCase() + (i % 6 === 0 ? "  " : ""),
  ].join("|"));
  return [head.join("|"), ...lines].join("\n");
}

const rule = (o: Partial<SideRule> = {}): SideRule => ({ trim: true, caseMode: "upper", stripSpecial: false, stripLeadingZeros: false, stripCurrency: true, dateFormat: "auto", ...o });
const pair = (id: string, label: string, colA: string, colB: string, type: ColumnPair["type"], extra: Partial<ColumnPair> = {}): ColumnPair =>
  ({ id, label, colA, colB, type, a: rule(type === "text" ? {} : { caseMode: "none" }), b: rule(type === "text" ? {} : { caseMode: "none" }), decimals: null, tolerance: 0, ...extra });

/** Ready-made mapping for the sample files (also a good example of a saved template). */
export function sampleConfig(): ReconConfig {
  return {
    version: 1,
    keys: [pair("k1", "Customer ID", "customer id", "Cust_ID", "number")],
    compares: [
      pair("c1", "Customer Name", "Customer Name", "Client_Name", "text"),
      pair("c2", "Pin Code", "Pin Code", "Postal_Code", "text", { a: rule({ stripLeadingZeros: true }), b: rule({ stripLeadingZeros: true }) }),
      pair("c3", "Amount", "Amount", "Invoice_Total", "number", { decimals: 2, tolerance: 0.01 }),
      pair("c4", "Invoice Date", "Invoice Date", "Inv_Date", "date", { a: rule({ caseMode: "none", dateFormat: "DMY" }), b: rule({ caseMode: "none", dateFormat: "YMD" }) }),
      pair("c5", "Status", "Status", "Order_Status", "text"),
    ],
  };
}

export const SAMPLE_FILES = { a: "finance_ledger_A.csv", b: "billing_export_B.txt" };
