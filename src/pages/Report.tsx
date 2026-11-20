/* RECIPE: Report page = PageHeader(export actions) -> Card with filters -> table + totals. Exports use lib/files.ts (CSV + Excel). */
import { useState } from "react";
import { Button } from "@quantumphinance/kraft-component";
import { STATUS_TONE } from "../config";
import { CATEGORIES, useRecords } from "../features/records";
import { Card, PageHeader } from "../layout/PageHeader";
import { downloadCsv, downloadXlsx } from "../lib/files";
import { fmt, inr } from "../lib/format";
import { DateInput, SelectInput, StatusChip, Tbl, Td, Tr } from "../ui";

export default function Report() {
  const { recs } = useRecords();
  const [cat, setCat] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const rows = recs.filter((r) => (!cat || r.category === cat) && (!from || r.date >= from) && (!to || r.date <= to));
  const heads = ["Ref. no.", "Name", "Category", "Amount", "Date", "Status"];
  const data = rows.map((r) => [r.id, r.name, r.category, String(r.amount), r.date, r.status]);
  const total = rows.reduce((a, r) => a + r.amount, 0);

  return (
    <>
      <PageHeader title="Summary Report" actions={<>
        <Button size="lg" variant="outline" onPress={() => downloadCsv("summary.csv", heads, data)}>Export CSV</Button>
        <Button size="lg" onPress={() => downloadXlsx("summary.xlsx", heads, data, "Summary")}>Export Excel</Button>
      </>} />
      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <SelectInput label="Category" value={cat} onChange={setCat} options={[...CATEGORIES]} blank="All" />
          <DateInput label="From" value={from} onChange={setFrom} />
          <DateInput label="To" value={to} onChange={setTo} />
        </div>
      </Card>
      <Card title={`${rows.length} record(s) · ₹ ${inr(total)}`}>
        <Tbl heads={["Ref. no.", "Name", "Category", "Amount (₹)", "Date", "Status"]} empty="No records for these filters.">
          {rows.map((r) => (
            <Tr key={r.id}><Td nowrap>{r.id}</Td><Td>{r.name}</Td><Td>{r.category}</Td><Td right>{inr(r.amount)}</Td><Td nowrap>{fmt(r.date)}</Td><Td><StatusChip status={r.status} tones={STATUS_TONE} /></Td></Tr>
          ))}
        </Tbl>
      </Card>
    </>
  );
}
