/* Reconciliation feature store: datasets, mapping config, run, result, templates and the audit log.
   Pages stay thin and call these actions. Data lives only in this browser (IndexedDB for the session, localStorage for config/logs). */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useApp } from "../lib/app";
import { idbDel, idbGet, idbSet } from "../lib/idb";
import { usePersistentState } from "../lib/storage";
import { defaultRule, emptyConfig, guessDateFormat, guessType, nameScore, nameTokens, reconcile } from "./recon-engine";
import type { ColumnPair, DataType, Dataset, ReconConfig, ReconResult } from "./recon-engine";
import { defaultOpts, missingColumns, parseFile } from "./recon-io";
import type { LoadedDataset, MappingTemplate, ParseOpts } from "./recon-io";
import { SAMPLE_FILES, sampleA, sampleB, sampleConfig } from "./recon-sample";

export type SideKey = "a" | "b";
export const SIDE_NAME: Record<SideKey, string> = { a: "Dataset A", b: "Dataset B" };

export interface LogEvent { id: string; at: string; by: string; action: string; detail?: string }

interface Loaded { ds: LoadedDataset; file: File }
interface Session { a: Loaded | null; b: Loaded | null; result: ReconResult | null; sig: string }

interface Store {
  ready: boolean;
  a: LoadedDataset | null;
  b: LoadedDataset | null;
  cfg: ReconConfig;
  setCfg: (c: ReconConfig | ((p: ReconConfig) => ReconConfig)) => void;
  result: ReconResult | null;
  /** The result was produced from different data or mapping than what is loaded now. */
  stale: boolean;
  running: boolean;
  load: (side: SideKey, file: File, opts?: ParseOpts) => Promise<LoadedDataset>;
  reparse: (side: SideKey, opts: ParseOpts) => Promise<void>;
  remove: (side: SideKey) => void;
  loadSample: () => Promise<void>;
  autoMap: () => number;
  newPair: (colA?: string, colB?: string, isKey?: boolean) => ColumnPair;
  run: () => Promise<ReconResult>;
  logExport: (file: string, rows: number) => void;
  templates: MappingTemplate[];
  saveTemplate: (name: string) => MappingTemplate;
  addTemplate: (t: MappingTemplate) => void;
  applyTemplate: (t: MappingTemplate) => string[];
  deleteTemplate: (id: string) => void;
  history: LogEvent[];
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);
const uid = () => crypto.randomUUID().slice(0, 8);
const signature = (s: Pick<Session, "a" | "b">, cfg: ReconConfig) =>
  JSON.stringify([s.a?.ds.fileName, s.a?.ds.rows.length, s.a?.ds.opts, s.b?.ds.fileName, s.b?.ds.rows.length, s.b?.ds.opts, cfg]);

const colValues = (ds: Dataset | null, col: string) => {
  const i = ds ? ds.headers.indexOf(col) : -1;
  return i < 0 || !ds ? [] : ds.rows.slice(0, 200).map((r) => r[i] ?? "");
};

/** Runs the engine in a Web Worker (falls back to the main thread if workers are unavailable). */
function runInWorker(a: Dataset, b: Dataset, cfg: ReconConfig): Promise<ReconResult> {
  const plain = (d: Dataset): Dataset => ({ fileName: d.fileName, headers: d.headers, rows: d.rows });
  return new Promise((resolve, reject) => {
    let w: Worker;
    try {
      w = new Worker(new URL("./recon.worker.ts", import.meta.url), { type: "module" });
    } catch {
      try { resolve(reconcile(a, b, cfg)); } catch (e) { reject(e); }
      return;
    }
    w.onmessage = (e: MessageEvent<{ ok: boolean; result?: ReconResult; error?: string }>) => {
      w.terminate();
      if (e.data.ok && e.data.result) resolve(e.data.result); else reject(new Error(e.data.error || "Reconciliation failed"));
    };
    w.onerror = () => { w.terminate(); try { resolve(reconcile(a, b, cfg)); } catch (e) { reject(e); } };
    w.postMessage({ a: plain(a), b: plain(b), cfg });
  });
}

export function ReconProvider({ children }: { children: ReactNode }) {
  const { me, notify } = useApp();
  const [cfg, setCfg, resetCfg] = usePersistentState<ReconConfig>("recon-config-v1", emptyConfig);
  const [templates, setTemplates] = usePersistentState<MappingTemplate[]>("recon-templates-v1", () => []);
  const [history, setHistory, resetHistory] = usePersistentState<LogEvent[]>("recon-log-v1", () => []);
  const [session, setSession] = useState<Session>({ a: null, b: null, result: null, sig: "" });
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const live = useRef(session);
  live.current = session;

  const log = useCallback((action: string, detail?: string) => {
    setHistory((h) => [{ id: uid(), at: new Date().toISOString(), by: `Demo User (${me.label})`, action, detail }, ...h].slice(0, 200));
  }, [setHistory, me.label]);

  // Restore the working session saved in this browser.
  useEffect(() => {
    idbGet<Session>("session").then((s) => { if (s) setSession({ a: s.a ?? null, b: s.b ?? null, result: s.result ?? null, sig: s.sig ?? "" }); }).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => { idbSet("session", session); }, 300);
    return () => clearTimeout(t);
  }, [session, ready]);

  const newPair = useCallback((colA = "", colB = "", isKey = false): ColumnPair => {
    const s = live.current;
    const va = colValues(s.a?.ds ?? null, colA), vb = colValues(s.b?.ds ?? null, colB);
    const ta = colA ? guessType(va) : "text", tb = colB ? guessType(vb) : "text";
    const type: DataType = ta === tb ? ta : "text";
    const a = defaultRule(type), b = defaultRule(type);
    if (type === "date") { a.dateFormat = guessDateFormat(va); b.dateFormat = guessDateFormat(vb); }
    return { id: uid(), label: colA, colA, colB, type, a, b, decimals: type === "number" && !isKey ? 2 : null, tolerance: 0 };
  }, []);

  const load = useCallback(async (side: SideKey, file: File, opts: ParseOpts = defaultOpts()) => {
    const ds = await parseFile(file, opts);
    setSession((s) => ({ ...s, [side]: { ds, file } }));
    log(`Loaded ${SIDE_NAME[side]}`, `${file.name} · ${ds.rows.length} rows × ${ds.headers.length} columns`);
    return ds;
  }, [log]);

  const store = useMemo<Store>(() => {
    const a = session.a?.ds ?? null, b = session.b?.ds ?? null;
    return {
      ready, a, b, cfg, setCfg, running, templates, history,
      result: session.result,
      stale: !!session.result && session.sig !== signature(session, cfg),
      load,
      newPair,
      reparse: async (side, opts) => {
        const cur = live.current[side];
        if (!cur) return;
        const ds = await parseFile(cur.file, opts);
        setSession((s) => ({ ...s, [side]: { ds, file: cur.file } }));
      },
      remove: (side) => {
        setSession((s) => ({ ...s, [side]: null }));
        log(`Removed ${SIDE_NAME[side]}`);
      },
      loadSample: async () => {
        const fa = new File([sampleA()], SAMPLE_FILES.a, { type: "text/csv" });
        const fb = new File([sampleB()], SAMPLE_FILES.b, { type: "text/plain" });
        const [da, db] = await Promise.all([parseFile(fa, defaultOpts()), parseFile(fb, defaultOpts())]);
        setSession({ a: { ds: da, file: fa }, b: { ds: db, file: fb }, result: null, sig: "" });
        setCfg(sampleConfig());
        log("Loaded sample data", `${SAMPLE_FILES.a} + ${SAMPLE_FILES.b} with a ready-made mapping`);
      },
      autoMap: () => {
        if (!a || !b) return 0;
        const pairs: [string, string, number][] = [];
        for (const ha of a.headers) for (const hb of b.headers) { const sc = nameScore(ha, hb); if (sc >= 0.5) pairs.push([ha, hb, sc]); }
        pairs.sort((x, y) => y[2] - x[2]);
        const usedA = new Set<string>(), usedB = new Set<string>(), chosen: [string, string][] = [];
        for (const [ha, hb] of pairs) if (!usedA.has(ha) && !usedB.has(hb)) { usedA.add(ha); usedB.add(hb); chosen.push([ha, hb]); }
        if (!chosen.length) return 0;
        const isId = (h: string) => nameTokens(h).some((t) => ["id", "key", "reference"].includes(t));
        const keyIdx = Math.max(0, chosen.findIndex(([ha, hb]) => isId(ha) || isId(hb)));
        const keys = [newPair(chosen[keyIdx][0], chosen[keyIdx][1], true)];
        const compares = chosen.filter((_, i) => i !== keyIdx).map(([ha, hb]) => newPair(ha, hb));
        setCfg({ version: 1, keys, compares });
        log("Auto-mapped columns", `${keys.length} key, ${compares.length} comparison column(s)`);
        return chosen.length;
      },
      run: async () => {
        if (!a || !b) throw new Error("Upload both datasets first");
        const miss = missingColumns(cfg, a, b);
        if (miss.length) throw new Error(`Mapped columns not found: ${miss.join(", ")}`);
        setRunning(true);
        try {
          const result = await runInWorker(a, b, cfg);
          const s = live.current;
          setSession({ ...s, result, sig: signature(s, cfg) });
          const x = result.summary;
          const exceptions = x.mismatched + x.missingInA + x.missingInB + x.duplicateRows;
          log("Ran reconciliation", `${a.fileName} vs ${b.fileName} · ${x.matched} matched, ${x.mismatched} mismatched, ${x.missingInB} missing in B, ${x.missingInA} missing in A, ${x.duplicateRows} duplicate-key rows`);
          notify("Reconciliation complete", `${x.matched} matched · ${exceptions} exception(s)`, "/recon/results");
          return result;
        } finally {
          setRunning(false);
        }
      },
      logExport: (file, rows) => log("Exported report", `${file} · ${rows} row(s)`),
      saveTemplate: (name) => {
        const t: MappingTemplate = {
          app: "2-way-recon", kind: "mapping-template", version: 1, id: uid(), name, savedAt: new Date().toISOString(),
          headersA: a?.headers ?? [], headersB: b?.headers ?? [], config: cfg,
        };
        setTemplates((l) => [t, ...l.filter((x) => x.name !== name)]);
        log("Saved mapping template", name);
        return t;
      },
      addTemplate: (t) => {
        setTemplates((l) => [t, ...l.filter((x) => x.id !== t.id && x.name !== t.name)]);
        log("Imported mapping template", t.name);
      },
      applyTemplate: (t) => {
        setCfg(t.config);
        log("Applied mapping template", t.name);
        return missingColumns(t.config, a, b);
      },
      deleteTemplate: (id) => {
        const t = templates.find((x) => x.id === id);
        setTemplates((l) => l.filter((x) => x.id !== id));
        log("Deleted mapping template", t?.name);
      },
      reset: () => {
        setSession({ a: null, b: null, result: null, sig: "" });
        idbDel("session");
        resetCfg();
        resetHistory();
      },
    };
  }, [session, ready, cfg, setCfg, running, templates, setTemplates, history, resetHistory, resetCfg, load, newPair, log, notify]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useRecon() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useRecon must be used inside <ReconProvider>");
  return c;
}
