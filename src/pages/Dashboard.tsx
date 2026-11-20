/* RECIPE: Dashboard = description line, quick-action buttons, KPI tiles (StatCard), chart cards. */
import { Button } from "@quantumphinance/kraft-component";
import { useNavigate } from "react-router-dom";
import { STATUS_COLOR } from "../config";
import { useRecords } from "../features/records";
import { Card, PageHeader, StatCard } from "../layout/PageHeader";
import { fmt, inr, lastMonths, monthKey } from "../lib/format";
import { Columns, Donut, HBars } from "../ui/charts";
import type { Slice } from "../ui/charts";

const grid = "mb-4 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5";
const kpis = "mb-4 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5";

export default function Dashboard() {
  const { recs } = useRecords();
  const nav = useNavigate();
  const go = (to: string) => () => nav(to);
  const count = (s: string) => recs.filter((r) => r.status === s).length;
  const statuses: Slice[] = Object.keys(STATUS_COLOR)
    .map((s) => ({ label: s, value: count(s), color: STATUS_COLOR[s] }))
    .filter((i) => i.value);
  const cats = [...new Set(recs.map((r) => r.category))].map((c) => ({ label: c, value: recs.filter((r) => r.category === c).length, color: "text-qp-blue" }));
  const ms = lastMonths(6);

  return (
    <>
      <PageHeader title="Home" back={false} description={`${fmt(new Date().toISOString())} · sample data is regenerated relative to today`} />
      <div className="mb-4 flex flex-wrap gap-2.5">
        <Button size="lg" onPress={go("/records/new")}>New Record</Button>
        <Button size="lg" variant="outline" onPress={go("/import")}>Import from Excel</Button>
      </div>
      <div className={kpis}>
        <StatCard value={recs.length} label="Total records" onClick={go("/records")} />
        <StatCard value={count("Pending") + count("In Review")} label="Awaiting review" tone="purple" onClick={go("/records?tab=open")} />
        <StatCard value={count("Sent Back")} label="Sent back" tone="amber" onClick={go("/records?tab=open")} />
        <StatCard value={count("Approved")} label="Approved" tone="green" onClick={go("/records?tab=closed")} />
        <StatCard value={count("Rejected")} label="Rejected" tone="red" onClick={go("/records?tab=closed")} hint={`₹ ${inr(recs.filter((r) => r.status === "Approved").reduce((a, r) => a + r.amount, 0), 0)} approved`} />
      </div>
      <div className={grid}>
        <Card title="Records by status"><Donut items={statuses} label="Records by status" /></Card>
        <Card title="Records by category"><HBars items={cats} /></Card>
        <Card title="Created per month">
          <Columns labels={ms.map((m) => m.label)} series={[{ name: "Records", color: "text-qp-blue", values: ms.map((m) => recs.filter((r) => monthKey(r.date) === m.key).length) }]} />
        </Card>
      </div>
    </>
  );
}
