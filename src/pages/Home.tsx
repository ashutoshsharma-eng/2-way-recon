/* Home: what the module does, quick actions, current session status, last result KPIs and the activity log. */
import { Button, useToast } from "@quantumphinance/kraft-component";
import { ArrowUpTrayIcon, BeakerIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { STATUS_TONE } from "../config";
import { useRecon } from "../features/recon";
import { num, pctOf, statusSlices } from "../features/recon-ui";
import { WORKFLOW } from "../features/recon-ui";
import { Card, PageHeader, StatCard } from "../layout/PageHeader";
import { fmt, fmtDT } from "../lib/format";
import { Banner, KV, StatusChip, Steps, Tbl, Td, Tr } from "../ui";
import { Donut } from "../ui/charts";

const kpis = "mb-4 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5";

export default function Home() {
  const r = useRecon();
  const nav = useNavigate();
  const toast = useToast();
  const s = r.result?.summary;
  const step = r.result && !r.stale ? 3 : r.cfg.keys.length && r.a && r.b ? 2 : r.a && r.b ? 1 : 0;
  const next = step >= 2 ? (step === 3 ? "/recon/results" : "/recon/map") : step === 1 ? "/recon/map" : "/recon/upload";
  const sample = async () => {
    try { await r.loadSample(); toast.success("Sample data loaded", "Mapping is pre-filled — review it, then run."); nav("/recon/map"); }
    catch (e) { toast.error("Could not load sample", (e as Error).message); }
  };

  return (
    <>
      <PageHeader title="Home" back={false} description={`${fmt(new Date().toISOString())} · Two-way reconciliation of any two files — runs entirely in your browser`} />
      <div className="mb-4 flex flex-wrap gap-2.5">
        <Button size="lg" startIcon={<ArrowUpTrayIcon className="h-4 w-4" />} onPress={() => nav("/recon/upload")}>New Reconciliation</Button>
        <Button size="lg" variant="outline" startIcon={<BeakerIcon className="h-4 w-4" />} onPress={sample}>Load Sample Data</Button>
        <Button size="lg" variant="outline" startIcon={<DocumentDuplicateIcon className="h-4 w-4" />} onPress={() => nav("/templates")}>Mapping Templates</Button>
      </div>
      <Banner tone="info" className="mb-4">
        <b>Private by design:</b> files are parsed and matched inside this browser tab (Web Worker). Nothing is uploaded to any server — your working session is kept only in this browser&rsquo;s local storage until you reset it.
      </Banner>

      <div className="mb-4 grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr]">
        <Card title="Current session" actions={<Button size="lg" variant="outline" onPress={() => nav(next)}>{step === 3 ? "View Results" : "Continue"}</Button>}>
          <div className="mb-4"><Steps names={WORKFLOW} current={Math.min(step, 2)} /></div>
          <KV rows={[
            ["Dataset A (Source)", r.a ? `${r.a.fileName} · ${num(r.a.rows.length)} rows × ${r.a.headers.length} cols` : "Not loaded"],
            ["Dataset B (Target)", r.b ? `${r.b.fileName} · ${num(r.b.rows.length)} rows × ${r.b.headers.length} cols` : "Not loaded"],
            ["Mapping", r.cfg.keys.length ? `${r.cfg.keys.length} key column(s): ${r.cfg.keys.map((k) => `${k.colA} ↔ ${k.colB}`).join(", ")} · ${r.cfg.compares.length} comparison column(s)` : "Not mapped yet"],
            ["Last run", r.result ? <>{fmtDT(r.result.at)} {r.stale && <StatusChip status="Stale" tones={STATUS_TONE} />}</> : "–"],
          ]} />
        </Card>
        <Card title="Result breakdown">
          {s ? <Donut items={statusSlices(s)} label="Rows by status" /> : <p className="text-[13px] text-qp-mut">Run a reconciliation to see the breakdown.</p>}
        </Card>
      </div>

      {s && (
        <div className={kpis}>
          <StatCard value={num(s.totalA)} label="Total Records A" onClick={() => nav("/recon/results")} />
          <StatCard value={num(s.totalB)} label="Total Records B" onClick={() => nav("/recon/results")} />
          <StatCard value={num(s.matched)} label="Exact Matches" hint={`${pctOf(s.matched, s.totalA)} of Dataset A`} tone="green" onClick={() => nav("/recon/results?tab=Matched")} />
          <StatCard value={num(s.mismatched)} label="Field Mismatches" tone="amber" onClick={() => nav("/recon/results?tab=Field Mismatch")} />
          <StatCard value={num(s.missingInB)} label="Missing in B" tone="red" onClick={() => nav("/recon/results?tab=Missing in B")} />
          <StatCard value={num(s.missingInA)} label="Missing in A" tone="purple" onClick={() => nav("/recon/results?tab=Missing in A")} />
        </div>
      )}

      <Card title="Activity log">
        <Tbl heads={["When", "By", "Action", "Details"]} empty="No activity yet — upload two files or load the sample data.">
          {r.history.slice(0, 15).map((h) => (
            <Tr key={h.id}><Td nowrap>{fmtDT(h.at)}</Td><Td nowrap>{h.by}</Td><Td nowrap>{h.action}</Td><Td>{h.detail ?? "–"}</Td></Tr>
          ))}
        </Tbl>
      </Card>
    </>
  );
}
