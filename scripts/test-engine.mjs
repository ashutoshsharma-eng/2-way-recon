#!/usr/bin/env node
/* Engine tests (no test framework needed): node scripts/test-engine.mjs   — also run by `npm run test:engine`. */
import assert from "node:assert/strict";
import Papa from "papaparse";
import { normalize, parseDate, parseNumber, reconcile, round, guessType, guessDateFormat, nameScore, defaultRule } from "../src/features/recon-engine.ts";
import { sampleA, sampleB, sampleConfig } from "../src/features/recon-sample.ts";

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; } catch (e) { console.error("✗", name, "\n ", e.message); process.exitCode = 1; } };

t("dates", () => {
  assert.equal(parseDate("15/03/2026", "DMY"), "2026-03-15");
  assert.equal(parseDate("03-15-2026", "MDY"), "2026-03-15");
  assert.equal(parseDate("2026-03-15", "YMD"), "2026-03-15");
  assert.equal(parseDate("2026-03-15T10:20:00Z", "auto"), "2026-03-15");
  assert.equal(parseDate("15-Mar-2026", "auto"), "2026-03-15");
  assert.equal(parseDate("Mar 15, 2026", "auto"), "2026-03-15");
  assert.equal(parseDate("20260315", "auto"), "2026-03-15");
  assert.equal(parseDate("46096", "EXCEL"), "2026-03-15");
  assert.equal(parseDate("31/02/2026", "DMY"), null);
  assert.equal(parseDate("15/03/26", "DMY"), "2026-03-15");
});
t("numbers", () => {
  assert.equal(parseNumber("₹1,50,000.50", true), 150000.5);
  assert.equal(parseNumber("(1,200)", true), -1200);
  assert.equal(parseNumber("1200-", true), -1200);
  assert.equal(parseNumber("USD 45", true), 45);
  assert.equal(parseNumber("1,200", false), null);
  assert.equal(parseNumber("abc", true), null);
  assert.equal(round(1.005, 2), 1.01);
  assert.equal(round(-2.675, 2), -2.68);
  assert.equal(normalize("00012345", "number", defaultRule("number")).v, normalize(12345, "number", defaultRule("number")).v);
});
t("text rules", () => {
  const r = { ...defaultRule("text"), stripSpecial: true, stripLeadingZeros: true };
  assert.equal(normalize("  00ab-12  x ", "text", r).v, "AB12 X");
  assert.equal(normalize(" Paid ", "text", { ...defaultRule("text"), caseMode: "lower" }).v, "paid");
  assert.equal(normalize("000", "text", r).v, "0");
});
t("guessing", () => {
  assert.equal(guessType(["001001", "1002"]), "number");
  assert.equal(guessType(["15/03/2026", "01/12/2026"]), "date");
  assert.equal(guessType(["Paid", "PENDING"]), "text");
  assert.equal(guessType(["12345678901234567890"]), "text");
  assert.equal(guessDateFormat(["03/15/2026", "04/01/2026"]), "MDY");
  assert.ok(nameScore("customer id", "Cust_ID") >= 0.99);
  assert.ok(nameScore("Pin Code", "Postal_Code") >= 0.99);
  assert.ok(nameScore("Amount", "Invoice_Total") >= 0.5);
});

const parse = (txt) => { const r = Papa.parse(txt, { skipEmptyLines: "greedy" }); return { headers: r.data[0], rows: r.data.slice(1), delim: r.meta.delimiter }; };
t("sample reconciliation", () => {
  const A = parse(sampleA()), B = parse(sampleB());
  assert.equal(A.delim, ","); assert.equal(B.delim, "|");
  const res = reconcile({ fileName: "a.csv", ...A }, { fileName: "b.txt", ...B }, sampleConfig());
  const s = res.summary;
  assert.equal(s.totalA, 61); assert.equal(s.totalB, 62);
  assert.equal(s.missingInB, 2, "missing in B");
  assert.equal(s.missingInA, 3, "missing in A");
  assert.equal(s.duplicateRows, 6, "1036: 2 in A + 1 in B; 1031: 1 in A + 2 in B");
  assert.equal(s.mismatched, 5, "field mismatches");
  const r1004 = res.rows.find((r) => r.key === "1004");
  assert.equal(r1004.status, "Field Mismatch");
  assert.match(r1004.reason, /Pin Code mismatch \(File A: 400059 vs File B: 400082\)/);
  assert.match(r1004.reason, /Amount mismatch \(File A: ₹1,500.00 vs File B: 1450, diff -50\)/);
  assert.equal(res.rows.find((r) => r.key === "1008").status, "Matched", "0.004 within tolerance");
  assert.match(res.rows.find((r) => r.key === "1024").reason, /Key \[1024\] missing in Dataset B/);
  assert.match(res.rows.find((r) => r.key === "2001").reason, /Key \[2001\] missing in Dataset A/);
  assert.equal(s.matched + s.mismatched + s.missingInB + res.rows.filter((r) => r.status === "Duplicate Key" && r.ai >= 0).length, 61);
  console.log("  sample:", JSON.stringify({ ...s, fieldCounts: undefined }));
});
t("composite keys + blank keys + missing column", () => {
  const A = { fileName: "a", headers: ["x", "y", "v"], rows: [["1", "a", "10"], ["1", "b", "20"], ["", "", "5"]] };
  const B = { fileName: "b", headers: ["X", "Y", "V"], rows: [["1", "A", "10"], ["1", "B", "21"]] };
  const p = (id, a, b, type) => ({ id, label: a, colA: a, colB: b, type, a: defaultRule(type), b: defaultRule(type), decimals: null, tolerance: 0 });
  const res = reconcile(A, B, { version: 1, keys: [p("k1", "x", "X", "text"), p("k2", "y", "Y", "text")], compares: [p("c1", "v", "V", "number")] });
  assert.deepEqual(res.rows.map((r) => r.status), ["Matched", "Field Mismatch", "Missing in B"]);
  assert.equal(res.rows[1].key, "1 | B");
  assert.equal(res.summary.blankKeys, 1);
  assert.throws(() => reconcile(A, B, { version: 1, keys: [p("k1", "zz", "X", "text")], compares: [] }), /not found in Dataset A/);
});
t("performance 100k x 100k", () => {
  const n = 100000;
  const mk = (off) => ({ fileName: "p", headers: ["id", "amt"], rows: Array.from({ length: n }, (_, i) => [String(i + off), String(i * 1.5)]) });
  const p = (id, a, b, type) => ({ id, label: a, colA: a, colB: b, type, a: defaultRule(type), b: defaultRule(type), decimals: 2, tolerance: 0 });
  const t0 = Date.now();
  const res = reconcile(mk(0), mk(10), { version: 1, keys: [p("k", "id", "id", "number")], compares: [p("c", "amt", "amt", "number")] });
  assert.equal(res.summary.missingInB, 10); assert.equal(res.summary.missingInA, 10);
  console.log(`  100k x 100k reconciled in ${Date.now() - t0} ms`);
});
console.log(process.exitCode ? "Engine tests FAILED" : `Engine tests passed (${passed}).`);
