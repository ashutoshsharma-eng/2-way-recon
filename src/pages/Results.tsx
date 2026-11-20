/* Step 3 — results dashboard: KPI cards, status breakdown, mismatches by field, status tabs, search, side-by-side grid with
   mismatched cells highlighted, row detail drawer, multi-format export (full / filtered / exceptions) and the activity log. */
import { useMemo, useState } from "react";
import { Button, useToast } from "@quantumphinance/kraft-component";
import { ArrowDownTrayIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useNavigate, useSearchParams } from "react-router-dom";
import { STATUS_TONE } from "../config";
import { useRecon } from "../features/recon";
import { STATUSES } from "../features/recon-engine";
import type { ResultRow, Status } from "../features/recon-engine";
import { exportReport } from "../features/recon-io";
import type { ExportFormat } from "../features/recon-io";
import { WorkflowCard, num, pctOf, statusSlices } from "../features/recon-ui";
import { Card, PageTitleBar, StatCard } from "../layout/PageHeader";
import { fmtDT } from "../lib/format";
import { Banner, CheckboxInput, Drawer, KV, Modal, SectionTitle, SelectInput, StatusChip, TabBar, Tbl, Td, TextInput, Tr } from "../ui";
import { Donut, HBars } from "../ui/charts";

const PAGE = 50;
const kpis = "mb-4 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3.5";
const bad = "rounded bg-red-100 px-1.5 py-0.5 font-medium text-red-800 dark:bg-red-900/40 dark:text-red-300";
const TAB_LABEL: Record<string, string> = { all: "All", Matched: "Matched", "Field Mismatch": "Field Mismatch", "Missing in B": "Missing in B", "Missing in A": "Missing in A", "Duplicate Key": "Duplicates" };
type Scope = "view" | "all" | "exceptions";
const TXT_DELIMS: [string, string][] = [["\t", "Tab"], ["|", "Pipe ( | )"], [";", "Semicolon ( ; )"], [",", "Comma ( , )"], ["custom", "Custom…"]];

export default function Results() {
  const r = useRecon();
  const nav = useNavigate();
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<ResultRow | null>(null);
  const [logs, setLogs] = useState(false);
  const [exp, setExp] = useState(false);
  const [scope, setScope] = useState<Scope>("view");
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [delim, setDelim] = useState("\t");
  const [custom, setCustom] = useState("");
  const [customErr, setCustomErr] = useState("");
  const [allCols, setAllCols] = useState(false);
  const tab = sp.get("tab") ?? "all";
  const res = r.result;
  const A = r.a, B = r.b;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: res?.rows.length ?? 0 };
    for (const s of STATUSES) c[s] = 0;
    res?.rows.forEach((x) => { c[x.status]++; });
    return c;
  }, [res]);
  const rows = useMemo(() => {
    if (!res) return [];
    const needle = q.trim().toLowerCase();
    return res.rows.filter((x) => (tab === "all" || x.status === tab) && (!needle || x.key.toLowerCase().includes(needle) || x.reason.toLowerCase().includes(needle)));
  }, [res, tab, q]);

  const rerun = async () => {
    try { const x = await r.run(); toast.success("Reconciliation re-run", `${x.summary.matched} matched · ${x.summary.ms} ms`); setPage(0); }
    catch (e) { toast.error("Reconciliation failed", (e as Error).message); }
  };

  const title = <PageTitleBar title="Results & Export" onRefresh={res ? rerun : undefined} onViewLogs={() => setLogs(true)}
    status={res && <StatusChip status={r.stale ? "Stale" : "Current"} tones={STATUS_TONE} />}
    actions={res && <>
      <Button size="lg" variant="outline" isDisabled={r.running || !A || !B} startIcon={<ArrowPathIcon className="h-4 w-4" />} onPress={rerun}>{r.running ? "Running…" : "Re-run"}</Button>
      <Button size="lg" isDisabled={!A || !B} startIcon={<ArrowDownTrayIcon className="h-4 w-4" />} onPress={() => setExp(true)}>Export</Button>
    </>} />;

  const logDrawer = (
    <Drawer open={logs} title="Activity log" onClose={() => setLogs(false)}>
      <Tbl heads={["When", "Action", "Details"]} empty="No activity yet.">
        {r.history.map((h) => <Tr key={h.id}><Td nowrap>{fmtDT(h.at)}</Td><Td nowrap>{h.action}</Td><Td>{h.detail ?? "–"}</Td></Tr>)}
      </Tbl>
    </Drawer>
  );

  if (!res) {
    return (
      <>
        {title}
        <WorkflowCard current={2} />
        <Card>
          <Banner className="mb-4">No reconciliation has been run yet in this session.</Banner>
          <div className="flex gap-2.5">
            <Button size="lg" variant="outline" onPress={() => nav("/recon/upload")}>Go to Upload</Button>
            <Button size="lg" isDisabled={!A || !B || !r.cfg.keys.length || r.running} onPress={rerun}>Run Reconciliation</Button>
          </div>
        </Card>
        {logDrawer}
      </>
    );
  }

  const s = res.summary;
  const cfg = res.config;
  const iA = (c: string) => A?.headers.indexOf(c) ?? -1, iB = (c: string) => B?.headers.indexOf(c) ?? -1;
  const cell = (row: ResultRow, side: "a" | "b", col: string) => {
    const ds = side === "a" ? A : B, idx = side === "a" ? row.ai : row.bi, ci = side === "a" ? iA(col) : iB(col);
    return idx >= 0 && ds && ci >= 0 ? ds.rows[idx]?.[ci] ?? "" : null;
  };
  const show = (v: string | null, hl: boolean) => (v === null ? <span className="text-qp-mut">–</span> : v === "" ? <span className={hl ? bad : "text-qp-mut"}>(blank)</span> : hl ? <span className={bad}>{v}</span> : v);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const go = (t: string) => { setSp((p) => { p.set("tab", t); return p; }); setPage(0); };
  const fieldBars = cfg.compares.map((c) => ({ label: c.label || c.colA, value: s.fieldCounts[c.id] ?? 0, color: "text-qp-amber" }));

  const customBad = format === "txt" && delim === "custom" && (!custom || /["\r\n]/.test(custom));
  const doExport = async () => {
    if (!A || !B) return;
    const d = format === "txt" ? (delim === "custom" ? custom : delim) : ",";
    const list = scope === "view" ? rows : scope === "exceptions" ? res.rows.filter((x) => x.status !== "Matched") : res.rows;
    const label = scope === "view" ? (tab === "all" ? "all" : TAB_LABEL[tab]) + (q ? "_filtered" : "") : scope === "exceptions" ? "exceptions" : "full";
    try {
      const name = await exportReport(list, A, B, res, { format, delimiter: d, allColumns: allCols, scopeLabel: label });
      r.logExport(name, list.length);
      toast.success("Report exported", `${name} · ${num(list.length)} row(s)`);
    } catch (e) { toast.error("Export failed", (e as Error).message); }
  };

  return (
    <>
      {title}
      <WorkflowCard current={2}>
        <span className="text-[13px] text-qp-mut">{res.fileA} ↔ {res.fileB} · run {fmtDT(res.at)} · {s.ms} ms</span>
      </WorkflowCard>
      {r.stale && <Banner className="mb-4">The data or mapping changed after this run. Results below are from the previous run — click <b>Re-run</b> to refresh.</Banner>}
      {(!A || !B) && <Banner className="mb-4">A dataset was removed, so row values cannot be shown or exported. Upload it again and re-run.</Banner>}

      <div className={kpis}>
        <StatCard value={num(s.totalA)} label="Total Records A" onClick={() => go("all")} />
        <StatCard value={num(s.totalB)} label="Total Records B" onClick={() => go("all")} />
        <StatCard value={num(s.matched)} label="Exact Matches" hint={`${pctOf(s.matched, s.totalA)} of Dataset A`} tone="green" onClick={() => go("Matched")} />
        <StatCard value={num(s.mismatched)} label="Field Mismatches" hint={pctOf(s.mismatched, s.totalA)} tone="amber" onClick={() => go("Field Mismatch")} />
        <StatCard value={num(s.missingInA)} label="Missing in A" hint="only in Dataset B" tone="purple" onClick={() => go("Missing in A")} />
        <StatCard value={num(s.missingInB)} label="Missing in B" hint="only in Dataset A" tone="red" onClick={() => go("Missing in B")} />
        <StatCard value={num(s.duplicateRows)} label="Duplicate-key rows" hint={`${s.dupKeysA} key(s) in A · ${s.dupKeysB} in B`} tone="red" onClick={() => go("Duplicate Key")} />
      </div>
      {(s.dupKeysA > 0 || s.dupKeysB > 0 || s.blankKeys > 0) && (
        <Banner className="mb-4">
          Data integrity: {s.dupKeysA} duplicate key(s) in Dataset A, {s.dupKeysB} in Dataset B{s.blankKeys ? `, ${s.blankKeys} row(s) with a blank key` : ""}. Duplicate-key rows are excluded from matching and listed under <b>Duplicates</b>.
        </Banner>
      )}
      <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
        <Card title="Rows by status"><Donut items={statusSlices(s)} label="Rows by status" /></Card>
        <Card title="Mismatches by field">{fieldBars.length ? <HBars items={fieldBars} /> : <p className="text-[13px] text-qp-mut">No comparison columns were mapped.</p>}</Card>
      </div>

      <Card>
        <div className="mb-3.5 max-w-md">
          <TextInput label="" value={q} onChange={(v) => { setQ(v); setPage(0); }} placeholder="Search by key or mismatch reason" />
        </div>
        <TabBar tabs={["all", ...STATUSES].map((id) => ({ id, label: TAB_LABEL[id], count: counts[id] }))} active={tab} onChange={go} />
        <Tbl heads={["Status", "Key", ...cfg.compares.flatMap((c) => [`${c.label || c.colA} · A`, `${c.label || c.colA} · B`]), "Mismatch_Reason"]} empty="No rows match this tab / search.">
          {rows.slice(cur * PAGE, cur * PAGE + PAGE).map((x) => (
            <Tr key={x.n} onClick={() => setDetail(x)}>
              <Td nowrap><StatusChip status={x.status} tones={STATUS_TONE} /></Td>
              <Td nowrap><span className="font-semibold">{x.key || "(blank)"}</span></Td>
              {cfg.compares.flatMap((c) => {
                const hl = x.diffs.includes(c.id);
                return [<Td key={c.id + "a"} nowrap>{show(cell(x, "a", c.colA), hl)}</Td>, <Td key={c.id + "b"} nowrap>{show(cell(x, "b", c.colB), hl)}</Td>];
              })}
              <Td><span className="block min-w-[260px] text-xs">{x.reason || <span className="text-qp-mut">–</span>}</span></Td>
            </Tr>
          ))}
        </Tbl>
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 text-[13px] text-qp-mut">
          <span>{rows.length ? `Showing ${num(cur * PAGE + 1)}–${num(Math.min(rows.length, cur * PAGE + PAGE))} of ${num(rows.length)}` : "0 rows"} · click a row for full details</span>
          <div className="flex items-center gap-2">
            <Button size="lg" variant="outline" isDisabled={cur === 0} startIcon={<ChevronLeftIcon className="h-4 w-4" />} onPress={() => setPage(cur - 1)}>Previous</Button>
            <span>Page {cur + 1} / {pages}</span>
            <Button size="lg" variant="outline" isDisabled={cur >= pages - 1} endIcon={<ChevronRightIcon className="h-4 w-4" />} onPress={() => setPage(cur + 1)}>Next</Button>
          </div>
        </div>
      </Card>

      {detail && (
        <Drawer open title={`Key ${detail.key || "(blank)"}`} wide onClose={() => setDetail(null)}>
          <div className="mb-4 flex items-center gap-3"><StatusChip status={detail.status} tones={STATUS_TONE} /><span className="text-[13px] text-qp-ink">{detail.reason || "All mapped columns match."}</span></div>
          <SectionTitle>Mapped columns</SectionTitle>
          <Tbl heads={["Column", "Dataset A", "Dataset B", "Result"]}>
            {[...cfg.keys.map((k) => ({ ...k, role: "Key" })), ...cfg.compares.map((c) => ({ ...c, role: "" }))].map((p) => {
              const hl = detail.diffs.includes(p.id);
              const both = detail.ai >= 0 && detail.bi >= 0;
              return (
                <Tr key={p.id} tone={hl ? "changed" : undefined}>
                  <Td nowrap>{p.role ? <b>{p.label || p.colA} (key)</b> : p.label || p.colA}</Td>
                  <Td>{show(cell(detail, "a", p.colA), hl)}</Td>
                  <Td>{show(cell(detail, "b", p.colB), hl)}</Td>
                  <Td>{p.role || !both ? "–" : hl ? "Mismatch" : "Match"}</Td>
                </Tr>
              );
            })}
          </Tbl>
          <div className="mt-2 grid grid-cols-1 gap-5 md:grid-cols-2">
            {(["a", "b"] as const).map((side) => {
              const ds = side === "a" ? A : B, idx = side === "a" ? detail.ai : detail.bi;
              return (
                <div key={side}>
                  <SectionTitle>{side === "a" ? `Dataset A row ${idx >= 0 ? idx + 2 : ""}` : `Dataset B row ${idx >= 0 ? idx + 2 : ""}`}</SectionTitle>
                  {ds && idx >= 0 ? <KV rows={ds.headers.map((h, i) => [h, ds.rows[idx][i] || "–"])} /> : <p className="text-[13px] text-qp-mut">No row in this dataset.</p>}
                </div>
              );
            })}
          </div>
        </Drawer>
      )}

      <Modal open={exp} title="Export reconciliation report" onClose={() => setExp(false)} actions={[
        { label: "Cancel", kind: "outline" },
        { label: "Export", kind: "solid", onClick: () => {
          if (customBad) { setCustomErr("Enter a delimiter (not a quote or line break)"); return false; }
          void doExport();
        } },
      ]}>
        <div className="flex flex-col gap-4">
          <SelectInput label="Rows" value={scope} blank={false} onChange={(v) => setScope(v as Scope)} options={[
            ["view", `Current view — ${TAB_LABEL[tab]}${q ? ` matching "${q}"` : ""} (${num(rows.length)})`],
            ["exceptions", `Exceptions only — everything except Matched (${num(res.rows.length - counts.Matched)})`],
            ["all", `Full report (${num(res.rows.length)})`],
          ]} />
          <SelectInput label="Format" value={format} blank={false} onChange={(v) => setFormat(v as ExportFormat)} options={[
            ["xlsx", "Excel .xlsx (Summary + Detail + Mapping tabs)"], ["csv", "CSV .csv (comma)"], ["txt", "Text .txt (choose delimiter)"],
          ]} />
          {format === "txt" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SelectInput label="Delimiter" value={delim} blank={false} options={TXT_DELIMS} onChange={(v) => { setDelim(v); setCustomErr(""); }} />
              {delim === "custom" && <TextInput label="Custom delimiter" required value={custom} maxLength={5} error={customErr} onChange={(v) => { setCustom(v); setCustomErr(""); }} placeholder="e.g. ~" />}
            </div>
          )}
          <CheckboxInput label="Also include every original column from both files" checked={allCols} onChange={setAllCols} />
          <p className="text-xs text-qp-mut">Always includes Status, Key, Mismatch_Reason, source row numbers and the mapped A / B values side by side.</p>
        </div>
      </Modal>
      {logDrawer}
    </>
  );
}
