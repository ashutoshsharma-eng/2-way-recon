/* App-wide context: demo role + notification bell. Domain data goes in src/features/<name>/store.tsx, not here. */
import { createContext, useCallback, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { DEFAULT_ROLE, ROLES } from "../config";
import type { RoleKey } from "../config";
import { usePersistentState } from "./storage";

export interface Notice { id: string; title: string; detail?: string; to?: string; at: string }

interface AppCtx {
  role: RoleKey;
  me: (typeof ROLES)[RoleKey];
  setRole: (r: RoleKey) => void;
  notices: Notice[];
  /** Add to the bell (e.g. "email sent to checker"). */
  notify: (title: string, detail?: string, to?: string) => void;
  clearNotices: () => void;
}
const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [stored, setRole] = usePersistentState<RoleKey>("app-role", () => DEFAULT_ROLE);
  const [notices, setNotices] = usePersistentState<Notice[]>("app-notices", () => []);
  const role: RoleKey = ROLES[stored] ? stored : DEFAULT_ROLE;
  const notify = useCallback((title: string, detail?: string, to?: string) => {
    setNotices((n) => [{ id: crypto.randomUUID(), title, detail, to, at: new Date().toISOString() }, ...n].slice(0, 50));
  }, [setNotices]);
  const value = useMemo<AppCtx>(() => ({
    role, me: ROLES[role], setRole, notices, notify, clearNotices: () => setNotices([]),
  }), [role, notices, notify, setNotices, setRole]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be used inside <AppProvider>");
  return c;
}
