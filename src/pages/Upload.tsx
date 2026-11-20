/* Step 1 — upload Dataset A (source / left) and Dataset B (target / right): .xlsx / .xls / .csv / .txt, delimiter + sheet options,
   instant preview of the first rows with row / column counts. */
import { useState } from "react";
import { Button, DropZone, useToast } from "@quantumphinance/kraft-component";
import { ArrowRightIcon, BeakerIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { SIDE_NAME, useRecon } from "../features/recon";
import type { SideKey } from "../features/recon";
import { ACCEPT, DELIMS, MAX_MB, delimName } from "../features/recon-io";
import type { Delim } from "../features/recon-io";
import { WorkflowCard, num, sizeText } from "../features/recon-ui";
import { Card, PageTitleBar } from "../layout/PageHeader";
import { Banner, CheckboxInput, Pill, SelectInput, Tbl, Td, Tr } from "../ui";

const PREVIEW = 8;
const ROLE: Record<SideKey, string> = { a: "Source / Left", b: "Target / Right" };

function DatasetCard({ side }: { side: SideKey }) {
  const r = useRecon();
  const toast = useToast();
  const ds = r[side];
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [zoneKey, setZoneKey] = useState(0);

  const take = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setErr("");
    if (!ACCEPT.some((e) => f.name.toLowerCase().endsWith(e))) { setErr(`${f.name}: use ${ACCEPT.join(" ")}`); setZoneKey((k) => k + 1); return; }
    setBusy(true);
    try {
      const d = await r.load(side, f, ds ? { ...ds.opts, sheet: "" } : undefined);
      toast.success(`${SIDE_NAME[side]} loaded`, `${num(d.rows.length)} rows × ${d.headers.length} columns`);
    } catch (e) {
      setErr((e as Error).message);
      toast.error(`Could not read ${f.name}`, (e as Error).message);
    } finally {
      setBusy(false);
      setZoneKey((k) => k + 1);
    }
  };
  const reparse = async (o: Partial<NonNullable<typeof ds>["opts"]>) => {
    if (!ds) return;
    setBusy(true);
    try { await r.reparse(side, { ...ds.opts, ...o }); } catch (e) { toast.error("Could not re-read file", (e as Error).message); } finally { setBusy(false); }
  };

  return (
    <Card title={`${SIDE_NAME[side]} — ${ROLE[side]}`} actions={ds && (
      <Button size="lg" variant="outline" color="danger" startIcon={<XMarkIcon className="h-4 w-4" />} onPress={() => r.remove(side)}>Remove</Button>
    )}>
      <DropZone key={zoneKey} label={ds ? "Replace file" : "Upload file"} accept={ACCEPT} multiple={false} maxSizeMB={MAX_MB}
        helperText={`${ACCEPT.join(" ")} · up to ${MAX_MB} MB · read locally, never uploaded`} onChange={take} isDisabled={busy} />
      {err && <Banner className="mt-3">{err}</Banner>}
      {busy && <p className="mt-3 text-[13px] text-qp-mut">Reading file…</p>}
      {ds && (
        <div className="mt-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Pill tone="blue">{ds.fileName}</Pill>
            <Pill tone="green">{num(ds.rows.length)} rows</Pill>
            <Pill tone="purple">{ds.headers.length} columns</Pill>
            <Pill tone="slate">{ds.kind === "excel" ? `Sheet: ${ds.detected}` : `Delimiter: ${delimName(ds.detected)}`}</Pill>
            {ds.size > 0 && <Pill tone="slate">{sizeText(ds.size)}</Pill>}
          </div>
          <div className="mb-4 grid grid-cols-1 items-end gap-5 md:grid-cols-2">
            {ds.kind === "text" ? (
              <SelectInput label="Delimiter" value={ds.opts.delimiter} blank={false} options={DELIMS} onChange={(v) => reparse({ delimiter: v as Delim })} disabled={busy} />
            ) : (
              <SelectInput label="Sheet" value={ds.opts.sheet} blank={false} options={ds.sheets} onChange={(v) => reparse({ sheet: v })} disabled={busy || ds.sheets.length < 2} />
            )}
            <div className="pb-2">
              <CheckboxInput label="First row contains column headers" checked={ds.opts.header} onChange={(v) => reparse({ header: v })} />
            </div>
          </div>
          <Tbl heads={["#", ...ds.headers]} empty="The file has a header row but no data rows.">
            {ds.rows.slice(0, PREVIEW).map((row, i) => (
              <Tr key={i}>
                <Td>{i + 1}</Td>
                {ds.headers.map((_, j) => <Td key={j} nowrap>{row[j] === "" ? <span className="text-qp-mut">–</span> : row[j]}</Td>)}
              </Tr>
            ))}
          </Tbl>
          <p className="mt-2 text-xs text-qp-mut">Showing first {Math.min(PREVIEW, ds.rows.length)} of {num(ds.rows.length)} rows.</p>
        </div>
      )}
    </Card>
  );
}

export default function Upload() {
  const r = useRecon();
  const nav = useNavigate();
  const toast = useToast();
  const both = !!r.a && !!r.b;
  return (
    <>
      <PageTitleBar title="Upload Datasets" onRefresh={() => nav(0)} actions={<>
        <Button size="lg" variant="outline" startIcon={<BeakerIcon className="h-4 w-4" />} onPress={async () => {
          try { await r.loadSample(); toast.success("Sample data loaded", "Mapping is pre-filled for you"); } catch (e) { toast.error("Could not load sample", (e as Error).message); }
        }}>Load Sample Data</Button>
        <Button size="lg" isDisabled={!both} endIcon={<ArrowRightIcon className="h-4 w-4" />} onPress={() => nav("/recon/map")}>Next: Map Columns</Button>
      </>} />
      <WorkflowCard current={0}>
        <span className="text-[13px] text-qp-mut">{both ? "Both datasets loaded — continue to mapping." : "Upload the two files you want to reconcile."}</span>
      </WorkflowCard>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <DatasetCard side="a" />
        <DatasetCard side="b" />
      </div>
    </>
  );
}
