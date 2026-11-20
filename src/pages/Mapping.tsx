/* Step 2 — map key columns (record linking, composite keys allowed) and comparison columns, and set per-column normalisation
   rules for Dataset A and Dataset B (text / number / date) with a live before → after preview. */
import { useState } from "react";
import { Button, useToast } from "@quantumphinance/kraft-component";
import {
  AdjustmentsHorizontalIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, KeyIcon, PlayIcon, PlusIcon, SparklesIcon, TrashIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useRecon } from "../features/recon";
import { defaultRule, normalize } from "../features/recon-engine";
import type { CaseMode, ColumnPair, DataType, DateFormat, SideRule } from "../features/recon-engine";
import { downloadTemplate, missingColumns, readTemplate, ruleText } from "../features/recon-io";
import { FileButton, WorkflowCard } from "../features/recon-ui";
import { Card, PageTitleBar } from "../layout/PageHeader";
import { Banner, CheckboxInput, Drawer, Modal, SectionTitle, SelectInput, Tbl, Td, TextInput, Tr } from "../ui";

type Kind = "keys" | "compares";
type Errs = Record<string, { colA?: string; colB?: string; tolerance?: string }>;

const TYPES: [DataType, string][] = [["text", "Text"], ["number", "Number"], ["date", "Date"]];
const CASES: [CaseMode, string][] = [["upper", "Ignore case (compare as UPPER)"], ["lower", "Ignore case (compare as lower)"], ["none", "Case-sensitive"]];
const DATE_FMTS: [DateFormat, string][] = [
  ["auto", "Auto-detect"], ["DMY", "DD/MM/YYYY (any separator)"], ["MDY", "MM/DD/YYYY (any separator)"], ["YMD", "YYYY-MM-DD (any separator)"],
  ["YYYYMMDD", "YYYYMMDD (no separator)"], ["EXCEL", "Excel serial number (e.g. 46096)"],
];
const DECIMALS: [string, string][] = [["", "No rounding"], ["0", "0 dp"], ["1", "1 dp"], ["2", "2 dp"], ["3", "3 dp"], ["4", "4 dp"]];

function SideRuleEditor({ pair, side, onChange }: { pair: ColumnPair; side: "a" | "b"; onChange: (r: SideRule) => void }) {
  const r = pair[side];
  const set = (p: Partial<SideRule>) => onChange({ ...r, ...p });
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-qp-line bg-qp-surface px-4 py-3.5">
      <div className="text-[13px] font-semibold text-qp-ink">{side === "a" ? "Dataset A" : "Dataset B"} · <span className="font-normal text-qp-mut">{side === "a" ? pair.colA : pair.colB || "–"}</span></div>
      {pair.type === "text" && <>
        <CheckboxInput label="Trim leading / trailing spaces (and collapse inner spaces)" checked={r.trim} onChange={(v) => set({ trim: v })} />
        <SelectInput label="Case" value={r.caseMode} blank={false} options={CASES} onChange={(v) => set({ caseMode: v as CaseMode })} />
        <CheckboxInput label="Strip special characters (keep letters, digits, spaces)" checked={r.stripSpecial} onChange={(v) => set({ stripSpecial: v })} />
        <CheckboxInput label="Strip leading zeros (000123 → 123)" checked={r.stripLeadingZeros} onChange={(v) => set({ stripLeadingZeros: v })} />
      </>}
      {pair.type === "number" && <>
        <CheckboxInput label="Strip currency symbols & thousands separators (₹ $ € £, INR, Rs, commas)" checked={r.stripCurrency} onChange={(v) => set({ stripCurrency: v })} />
        <p className="text-xs text-qp-mut">Text is always cast to a number, so &quot;012345&quot; equals 12345. (1,200) and 1200- read as negatives.</p>
      </>}
      {pair.type === "date" && <>
        <SelectInput label="Input date format" value={r.dateFormat} blank={false} options={DATE_FMTS} onChange={(v) => set({ dateFormat: v as DateFormat })} />
        <p className="text-xs text-qp-mut">Normalised to ISO YYYY-MM-DD before comparison. Month names (15-Mar-2026) and a trailing time are understood.</p>
      </>}
    </div>
  );
}

function RulesDrawer({ pair, kind, onClose, onChange }: { pair: ColumnPair; kind: Kind; onClose: () => void; onChange: (p: ColumnPair) => void }) {
  const { a, b } = useRecon();
  const [tol, setTol] = useState(String(pair.tolerance));
  const sample = (ds: typeof a, col: string) => {
    const i = ds ? ds.headers.indexOf(col) : -1;
    return i < 0 || !ds ? [] : ds.rows.map((r) => r[i] ?? "").filter((v) => v.trim() !== "").slice(0, 8);
  };
  const sa = sample(a, pair.colA), sb = sample(b, pair.colB);
  const show = (raw: string, side: "a" | "b") => {
    const n = normalize(raw, pair.type, pair[side], pair.decimals);
    return n.ok ? <span className="font-medium">{n.v || "(blank)"}</span> : <span className="text-qp-red">invalid {pair.type}</span>;
  };
  const setType = (t: DataType) => {
    const keepDate = (r: SideRule) => ({ ...defaultRule(t), dateFormat: r.dateFormat });
    onChange({ ...pair, type: t, a: keepDate(pair.a), b: keepDate(pair.b), decimals: t === "number" && kind === "compares" ? 2 : null, tolerance: 0 });
    setTol("0");
  };
  return (
    <Drawer open title={`Transformation rules · ${pair.colA || "?"} ↔ ${pair.colB || "?"}`} wide onClose={onClose}>
      <div className="mb-4 grid grid-cols-1 gap-5 md:grid-cols-3">
        {kind === "compares" && <TextInput label="Label (used in Mismatch_Reason)" value={pair.label} onChange={(v) => onChange({ ...pair, label: v })} />}
        <SelectInput label="Data type" value={pair.type} blank={false} options={TYPES} onChange={(v) => setType(v as DataType)} />
        {pair.type === "number" && <>
          <SelectInput label="Decimal rounding (both sides)" value={pair.decimals === null ? "" : String(pair.decimals)} blank={false} options={DECIMALS}
            onChange={(v) => onChange({ ...pair, decimals: v === "" ? null : Number(v) })} />
          {kind === "compares" && (
            <TextInput label="Numeric tolerance (±)" value={tol} help="e.g. 0.01 — differences within ± this value count as a match"
              error={Number(tol) >= 0 && tol.trim() !== "" ? undefined : "Enter 0 or a positive number"}
              onChange={(v) => { setTol(v); if (Number(v) >= 0 && v.trim() !== "") onChange({ ...pair, tolerance: Number(v) }); }} />
          )}
        </>}
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <SideRuleEditor pair={pair} side="a" onChange={(r) => onChange({ ...pair, a: r })} />
        <SideRuleEditor pair={pair} side="b" onChange={(r) => onChange({ ...pair, b: r })} />
      </div>
      <SectionTitle>Live preview (first non-blank values)</SectionTitle>
      <Tbl heads={["Raw A", "→ Normalised A", "Raw B", "→ Normalised B"]} empty="No sample values in these columns.">
        {Array.from({ length: Math.max(sa.length, sb.length) }, (_, i) => (
          <Tr key={i}>
            <Td nowrap>{sa[i] ?? ""}</Td><Td nowrap>{sa[i] !== undefined ? show(sa[i], "a") : ""}</Td>
            <Td nowrap>{sb[i] ?? ""}</Td><Td nowrap>{sb[i] !== undefined ? show(sb[i], "b") : ""}</Td>
          </Tr>
        ))}
      </Tbl>
      <div className="mt-5"><Button size="lg" onPress={onClose}>Done</Button></div>
    </Drawer>
  );
}

function PairTable({ kind, errs, onEdit }: { kind: Kind; errs: Errs; onEdit: (id: string) => void }) {
  const { a, b, cfg, setCfg, newPair } = useRecon();
  const list = cfg[kind];
  const optsA = a?.headers ?? [], optsB = b?.headers ?? [];
  const update = (id: string, patch: Partial<ColumnPair>) => setCfg((c) => ({ ...c, [kind]: c[kind].map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  const changeCol = (p: ColumnPair, side: "colA" | "colB", v: string) => {
    const colA = side === "colA" ? v : p.colA, colB = side === "colB" ? v : p.colB;
    const fresh = colA && colB ? newPair(colA, colB, kind === "keys") : null;
    const label = !p.label || p.label === p.colA ? colA : p.label;
    update(p.id, fresh ? { ...fresh, id: p.id, label } : { [side]: v, label });
  };
  const heads = ["#", ...(kind === "compares" ? ["Label"] : []), "Dataset A column", "Dataset B column", "Type", "Normalisation (A | B)", ""];
  return (
    <>
      <Tbl heads={heads} empty={kind === "keys" ? "No key column yet — add one, or use Auto-map." : "No comparison columns — only key presence will be reconciled."}>
        {list.map((p, i) => (
          <Tr key={p.id}>
            <Td>{i + 1}</Td>
            {kind === "compares" && <Td><div className="min-w-[140px]"><TextInput label="" value={p.label} onChange={(v) => update(p.id, { label: v })} /></div></Td>}
            <Td><div className="min-w-[170px]"><SelectInput label="" value={p.colA} options={optsA} error={errs[p.id]?.colA} onChange={(v) => changeCol(p, "colA", v)} /></div></Td>
            <Td><div className="min-w-[170px]"><SelectInput label="" value={p.colB} options={optsB} error={errs[p.id]?.colB} onChange={(v) => changeCol(p, "colB", v)} /></div></Td>
            <Td><div className="min-w-[130px]"><SelectInput label="" value={p.type} blank={false} options={TYPES} onChange={(v) => {
              const t = v as DataType;
              update(p.id, { type: t, a: { ...defaultRule(t), dateFormat: p.a.dateFormat }, b: { ...defaultRule(t), dateFormat: p.b.dateFormat }, decimals: t === "number" && kind === "compares" ? 2 : null, tolerance: 0 });
            }} /></div></Td>
            <Td><span className="text-xs text-qp-mut">{ruleText(p, "a")} <span className="text-qp-line">|</span> {ruleText(p, "b")}</span></Td>
            <Td nowrap>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" startIcon={<AdjustmentsHorizontalIcon className="h-4 w-4" />} onPress={() => onEdit(p.id)}>Rules</Button>
                <button type="button" aria-label={`Remove row ${i + 1}`} title="Remove" className="rounded-md p-1.5 text-qp-mut hover:bg-qp-hover hover:text-qp-red"
                  onClick={() => setCfg((c) => ({ ...c, [kind]: c[kind].filter((x) => x.id !== p.id) }))}>
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </Td>
          </Tr>
        ))}
      </Tbl>
      <div className="mt-3.5">
        <Button size="lg" variant="outline" startIcon={<PlusIcon className="h-4 w-4" />} onPress={() => setCfg((c) => ({ ...c, [kind]: [...c[kind], newPair("", "", kind === "keys")] }))}>
          {kind === "keys" ? "Add key column" : "Add comparison column"}
        </Button>
      </div>
    </>
  );
}

export default function Mapping() {
  const r = useRecon();
  const nav = useNavigate();
  const toast = useToast();
  const [errs, setErrs] = useState<Errs>({});
  const [editing, setEditing] = useState<{ kind: Kind; id: string } | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplErr, setTplErr] = useState("");

  if (!r.a || !r.b) {
    return (
      <>
        <PageTitleBar title="Map & Transform" />
        <WorkflowCard current={1} />
        <Card>
          <Banner className="mb-4">Upload both Dataset A and Dataset B before mapping columns.</Banner>
          <div className="flex gap-2.5">
            <Button size="lg" variant="outline" onPress={async () => { await r.loadSample(); toast.success("Sample data loaded"); }}>Load Sample Data</Button>
            <Button size="lg" onPress={() => nav("/recon/upload")}>Go to Upload</Button>
          </div>
        </Card>
      </>
    );
  }

  const missing = missingColumns(r.cfg, r.a, r.b);
  const editPair = editing ? r.cfg[editing.kind].find((p) => p.id === editing.id) : undefined;

  const validate = () => {
    const e: Errs = {};
    for (const p of [...r.cfg.keys, ...r.cfg.compares]) {
      const x: Errs[string] = {};
      if (!p.colA) x.colA = "Required"; else if (!r.a!.headers.includes(p.colA)) x.colA = "Not in file";
      if (!p.colB) x.colB = "Required"; else if (!r.b!.headers.includes(p.colB)) x.colB = "Not in file";
      if (Object.keys(x).length) e[p.id] = x;
    }
    setErrs(e);
    if (!r.cfg.keys.length) { toast.error("Map at least one key column", "Keys link a record in A to its record in B"); return false; }
    if (Object.keys(e).length) { toast.error("Fix the highlighted fields"); return false; }
    return true;
  };

  const run = async () => {
    if (!validate()) return;
    try {
      const res = await r.run();
      toast.success("Reconciliation complete", `${res.summary.matched} matched of ${res.summary.totalA} · ${res.summary.ms} ms`);
      nav("/recon/results");
    } catch (e) {
      toast.error("Reconciliation failed", (e as Error).message);
    }
  };

  return (
    <>
      <PageTitleBar title="Map & Transform" onRefresh={() => setErrs({})} actions={<>
        <FileButton label="Load Template" accept=".json,application/json" icon={<ArrowUpTrayIcon className="h-4 w-4" />} onFile={async (f) => {
          try {
            const t = await readTemplate(f);
            r.addTemplate(t);
            const miss = r.applyTemplate(t);
            if (miss.length) toast.warning(`Template "${t.name}" applied with gaps`, `Not in current files: ${miss.join(", ")}`);
            else toast.success("Template applied", t.name);
          } catch (e) { toast.error("Could not load template", (e as Error).message); }
        }} />
        <Button size="lg" variant="outline" startIcon={<ArrowDownTrayIcon className="h-4 w-4" />} isDisabled={!r.cfg.keys.length}
          onPress={() => { setTplName(""); setTplErr(""); setSaveOpen(true); }}>Save as Template</Button>
        <Button size="lg" variant="outline" startIcon={<SparklesIcon className="h-4 w-4" />} onPress={() => {
          const n = r.autoMap();
          setErrs({});
          if (n) toast.success("Columns auto-mapped", `${n} pair(s) matched by name — review the key and types`); else toast.warning("No similar column names found", "Map the columns manually");
        }}>Auto-map</Button>
        <Button size="lg" isDisabled={r.running} startIcon={<PlayIcon className="h-4 w-4" />} onPress={run}>{r.running ? "Running…" : "Run Reconciliation"}</Button>
      </>} />
      <WorkflowCard current={1}>
        <span className="text-[13px] text-qp-mut">{r.a.fileName} ({r.a.headers.length} cols) ↔ {r.b.fileName} ({r.b.headers.length} cols)</span>
      </WorkflowCard>
      {missing.length > 0 && <Banner className="mb-4">These mapped columns are not in the loaded files: <b>{missing.join(", ")}</b>. Pick replacements below.</Banner>}

      <Card title="Key columns — record linking" className="mb-4" actions={<span className="flex items-center gap-1.5 text-xs text-qp-mut"><KeyIcon className="h-4 w-4" /> Add several rows for a composite key</span>}>
        <p className="mb-3.5 text-[13px] text-qp-mut">Rows whose normalised key values are equal are treated as the same record. Example: <i>customer id</i> ↔ <i>Cust_ID</i> as Number makes &quot;001001&quot; match 1001.</p>
        <PairTable kind="keys" errs={errs} onEdit={(id) => setEditing({ kind: "keys", id })} />
      </Card>
      <Card title="Comparison columns — field-level reconciliation">
        <p className="mb-3.5 text-[13px] text-qp-mut">Compared only when a key matches. Every difference is written to <b>Mismatch_Reason</b>, e.g. &quot;Pin Code mismatch (File A: 400059 vs File B: 400082)&quot;.</p>
        <PairTable kind="compares" errs={errs} onEdit={(id) => setEditing({ kind: "compares", id })} />
      </Card>

      {editing && editPair && (
        <RulesDrawer key={editPair.id} pair={editPair} kind={editing.kind} onClose={() => setEditing(null)}
          onChange={(p) => r.setCfg((c) => ({ ...c, [editing.kind]: c[editing.kind].map((x) => (x.id === p.id ? p : x)) }))} />
      )}

      <Modal open={saveOpen} title="Save mapping template" onClose={() => setSaveOpen(false)} actions={[
        { label: "Cancel", kind: "outline" },
        { label: "Save & Download", kind: "solid", onClick: () => {
          if (!tplName.trim()) { setTplErr("Enter a template name"); return false; }
          const t = r.saveTemplate(tplName.trim());
          downloadTemplate(t);
          toast.success("Template saved", `${t.name} — kept in Mapping Templates and downloaded as .json`);
        } },
      ]}>
        <p className="mb-3 text-[13px] text-qp-mut">Saves key + comparison columns and all transformation rules. Reuse it next time with <b>Load Template</b>.</p>
        <TextInput label="Template name" required value={tplName} error={tplErr} onChange={(v) => { setTplName(v); setTplErr(""); }} placeholder="e.g. Monthly ledger vs billing" />
      </Modal>
    </>
  );
}
