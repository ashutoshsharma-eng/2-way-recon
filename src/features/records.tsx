/* EXAMPLE feature store (replace with the real domain). One file per feature: types + seed + context + actions.
   Pattern to copy: every action changes state, appends to `history` (audit trail) and calls notify() when someone must be told. */
import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useApp } from "../lib/app";
import { today } from "../lib/format";
import { usePersistentState } from "../lib/storage";

export type RecordStatus = "Draft" | "Pending" | "In Review" | "Sent Back" | "Approved" | "Rejected";
export const CATEGORIES = ["Equity", "Debt", "Hybrid", "Cash"] as const;

export interface HistoryEvent { at: string; by: string; action: string; remark?: string }
export interface Rec {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  owner: string;
  status: RecordStatus;
  notes: string;
  files: string[];
  history: HistoryEvent[];
}

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString();
const mk = (i: number, name: string, category: string, amount: number, status: RecordStatus, ago: number, owner = "Demo User"): Rec => ({
  id: `REC-${new Date().getFullYear()}-${String(i).padStart(4, "0")}`, name, category, amount, date: daysAgo(ago).slice(0, 10), owner, status, notes: "",
  files: [], history: [{ at: daysAgo(ago), by: owner, action: "Created" }, ...(status === "Draft" ? [] : [{ at: daysAgo(ago - 1 < 0 ? 0 : ago - 1), by: owner, action: `Moved to ${status}` }])],
});
export const seed = (): Rec[] => [
  mk(1, "Alpha Growth Fund", "Equity", 1250000, "Approved", 40),
  mk(2, "Bravo Credit Note", "Debt", 480000, "Pending", 6),
  mk(3, "Charlie Balanced", "Hybrid", 920000, "In Review", 4),
  mk(4, "Delta Liquid", "Cash", 150000, "Sent Back", 9),
  mk(5, "Echo Income Trust", "Debt", 760000, "Rejected", 21),
  mk(6, "Foxtrot Opportunities", "Equity", 2100000, "Draft", 1),
];

interface Store {
  recs: Rec[];
  get: (id: string) => Rec | undefined;
  add: (d: Pick<Rec, "name" | "category" | "amount" | "date" | "notes" | "files">, submit: boolean) => Rec;
  decide: (id: string, d: "approve" | "reject" | "sendback", remark: string) => void;
  remove: (id: string) => void;
  importRows: (rows: Pick<Rec, "name" | "category" | "amount" | "date">[]) => number;
  reset: () => void;
}
const Ctx = createContext<Store | null>(null);

export function RecordsProvider({ children }: { children: ReactNode }) {
  const { me, notify } = useApp();
  const [recs, setRecs, reset] = usePersistentState<Rec[]>("records-v1", seed);
  const who = `Demo User (${me.label})`;
  const ev = (action: string, remark?: string): HistoryEvent => ({ at: new Date().toISOString(), by: who, action, remark });

  const store = useMemo<Store>(() => ({
    recs,
    get: (id) => recs.find((r) => r.id === id),
    add: (d, submit) => {
      const status: RecordStatus = submit ? "Pending" : "Draft";
      const r: Rec = { ...d, id: `REC-${new Date().getFullYear()}-${String(recs.length + 1).padStart(4, "0")}`, owner: "Demo User", status, history: [ev(submit ? "Submitted" : "Saved as draft")] };
      setRecs((p) => [r, ...p]);
      if (submit) notify("Record submitted", `${r.id} awaits review`, `/records/${r.id}`);
      return r;
    },
    decide: (id, d, remark) => {
      const status: RecordStatus = d === "approve" ? "Approved" : d === "reject" ? "Rejected" : "Sent Back";
      setRecs((p) => p.map((r) => (r.id === id ? { ...r, status, history: [...r.history, ev(status, remark)] } : r)));
      notify(`Record ${status.toLowerCase()}`, id, `/records/${id}`);
    },
    remove: (id) => setRecs((p) => p.filter((r) => r.id !== id)),
    importRows: (rows) => {
      const base = recs.length;
      setRecs((p) => [...rows.map((x, i): Rec => ({ ...x, id: `REC-${new Date().getFullYear()}-${String(base + i + 1).padStart(4, "0")}`, owner: "Import", status: "Approved", notes: "", files: [], history: [{ at: new Date().toISOString(), by: who, action: "Imported", remark: today() }] })), ...p]);
      return rows.length;
    },
    reset: () => { reset(); },
  }), [recs, setRecs, reset, notify]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useRecords() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useRecords must be used inside <RecordsProvider>");
  return c;
}
