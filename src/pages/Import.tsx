/* RECIPE: Excel/CSV import = PageHeader(download template) -> Card: pick file -> validate rows -> preview with row errors -> Import.
   Column spec below is the contract: change COLS to the team's Excel layout. */
import { useState } from "react";
import { Button, useToast } from "@quantumphinance/kraft-component";
import { useNavigate } from "react-router-dom";
import { CATEGORIES, useRecords } from "../features/records";
import { Card, PageHeader } from "../layout/PageHeader";
import { downloadXlsx, readSheet } from "../lib/files";
import { Banner, Tbl, Td, Tr } from "../ui";

const COLS = ["Name", "Category", "Amount", "Date (YYYY-MM-DD)"];
interface Row { n: number; cells: string[]; errors: string[] }

function validate(rows: string[][]): Row[] {
  return rows.slice(1).map((c, i) => {
    const errors: string[] = [];
    if (!c[0]) errors.push("Name missing");
    if (!(CATEGORIES as readonly string[]).includes(c[1])) errors.push(`Category must be one of ${CATEGORIES.join("/")}`);
    if (!(Number(c[2]) > 0)) errors.push("Amount must be > 0");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c[3] ?? "")) errors.push("Date must be YYYY-MM-DD");
    return { n: i + 2, cells: c, errors };
  });
}

export default function Import() {
  const { importRows } = useRecords();
  const toast = useToast();
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [name, setName] = useState("");
  const bad = rows?.filter((r) => r.errors.length).length ?? 0;

  return (
    <>
      <PageHeader title="Data Import" actions={<Button size="lg" variant="outline" onPress={() => downloadXlsx("import-template.xlsx", COLS, [["Sample Fund", "Equity", "100000", "2026-01-31"]], "Template")}>Download Template</Button>} />
      <Card title="Upload Excel / CSV">
        <input type="file" accept=".xlsx,.xls,.csv" aria-label="Choose file" className="text-sm text-qp-ink"
          onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            if (f.size > 5 * 1024 * 1024) { toast.error("File too large", "Maximum 5 MB"); e.target.value = ""; return; }
            setName(f.name);
            try { setRows(validate(await readSheet(f))); } catch { toast.error("Could not read file"); }
          }} />
        {rows && (
          <div className="mt-5">
            <Banner tone={bad ? "warn" : "info"} className="mb-3">{name}: {rows.length} row(s), {bad} with errors. {bad ? "Fix the file and upload again." : "Ready to import."}</Banner>
            <Tbl heads={["Row", ...COLS, "Result"]}>
              {rows.slice(0, 50).map((r) => (
                <Tr key={r.n} tone={r.errors.length ? "changed" : undefined}>
                  <Td>{r.n}</Td>{COLS.map((_, i) => <Td key={i}>{r.cells[i] ?? ""}</Td>)}<Td>{r.errors.join("; ") || "OK"}</Td>
                </Tr>
              ))}
            </Tbl>
            <div className="mt-5 flex gap-2.5">
              <Button size="lg" variant="outline" onPress={() => setRows(null)}>Clear</Button>
              <Button size="lg" isDisabled={bad > 0 || rows.length === 0} onPress={() => {
                const n = importRows(rows.map((r) => ({ name: r.cells[0], category: r.cells[1], amount: Number(r.cells[2]), date: r.cells[3] })));
                toast.success("Import complete", `${n} record(s) added`); nav("/records");
              }}>Import</Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
