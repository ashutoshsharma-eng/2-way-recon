import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Menu, useToast } from "@quantumphinance/kraft-component";
import {
  Bars3Icon, BellIcon, ChevronDownIcon, KeyIcon, MagnifyingGlassIcon, MoonIcon, SunIcon, UserIcon,
} from "@heroicons/react/24/outline";
import { APP, OPEN_GROUPS, ROLES, activeNavFor, buildNav } from "../config";
import type { RoleKey } from "../config";
import { useApp } from "../lib/app";
import { fmtDT } from "../lib/format";
import { useTheme } from "../lib/theme";
import { Modal } from "../ui";
import { SideNav } from "./SideNav";
import { TriggerLabel } from "./TriggerLabel";

const iconBtn = "relative flex items-center rounded-md p-1.5 text-qp-ink transition-colors hover:bg-qp-hover";

/** Notification bell: latest notices pushed with `useApp().notify(...)`. */
function Bell() {
  const app = useApp();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  const list = app.notices;
  const go = (to?: string) => { setOpen(false); if (to) nav(to); };
  return (
    <div ref={box} className="relative">
      <button className={iconBtn} aria-label={`Notifications${list.length ? ` (${list.length})` : ""}`} aria-expanded={open} title="Notifications" onClick={() => setOpen((o) => !o)}>
        <BellIcon className="h-5 w-5" />
        {list.length > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-700 px-1 text-[10px] font-bold text-white">{Math.min(list.length, 9)}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-40 w-[360px] max-w-[90vw] rounded-lg border border-qp-line bg-qp-surface p-1.5 shadow-xl">
          <div className="flex items-center justify-between px-3 pb-1 pt-2">
            <span className="text-[11px] uppercase tracking-[0.08em] text-qp-mut">Notifications</span>
            {list.length > 0 && <button type="button" className="text-xs text-qp-blue hover:underline" onClick={() => app.clearNotices()}>Clear</button>}
          </div>
          {list.length === 0 && <div className="px-3 py-2 text-xs text-qp-mut">No notifications yet.</div>}
          {list.slice(0, 8).map((n) => (
            <button key={n.id} type="button" onClick={() => go(n.to)}
              className="block w-full border-b border-qp-line/60 px-3 py-2 text-left text-xs text-qp-ink hover:bg-qp-hover">
              <strong className="font-semibold">{n.title}</strong>
              <div className="text-qp-mut">{n.detail ? `${n.detail} · ` : ""}{fmtDT(n.at)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * THE app frame — identical in every app. Do not restyle or restructure.
 * pale-blue sidebar | header (search · key · theme · bell · user) / page / footer.
 * Below the lg breakpoint the sidebar becomes a slide-over opened from the menu button.
 */
export default function AppShell({ navCounts, onReset }: { navCounts?: Record<string, number>; onReset?: () => void }) {
  const [mobileNav, setMobileNav] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const { dark, toggle } = useTheme();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const toast = useToast();
  const app = useApp();
  const activeId = activeNavFor(pathname);

  useEffect(() => setMobileNav(false), [pathname]);

  const select = (id: string) => (id === "reset" ? setConfirmReset(true) : nav("/" + id));

  const sidebar = (
    <SideNav
      items={buildNav(app.role, navCounts)}
      activeId={activeId}
      onSelect={select}
      openGroups={OPEN_GROUPS}
      onSwitchModule={() => nav("/dashboard")}
    />
  );

  return (
    <div className="flex h-full">
      <div className="hidden h-full lg:block">{sidebar}</div>
      {mobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-gray-900/40" onClick={() => setMobileNav(false)} aria-hidden />
          <div className="relative h-full w-fit shadow-xl">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-4 px-6 py-3">
          <button onClick={() => setMobileNav(true)} className={`${iconBtn} lg:hidden`} aria-label="Open menu">
            <Bars3Icon className="h-5 w-5" />
          </button>
          <form
            role="search"
            className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-lg bg-qp-search px-3.5 text-qp-mut"
            onSubmit={(e) => {
              e.preventDefault();
              const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
              if (q) nav(`${APP.searchRoute}?q=${encodeURIComponent(q)}`);
            }}
          >
            <MagnifyingGlassIcon className="h-5 w-5 shrink-0" />
            <input
              name="q"
              type="search"
              aria-label="Search"
              placeholder={APP.searchPlaceholder}
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-qp-ink outline-none placeholder:text-qp-mut"
            />
          </form>
          <div className="flex items-center gap-2">
            <button className={iconBtn} aria-label="Keys" title="Change password" onClick={() => toast.info("Keys", "Change password / API keys are outside this module’s scope.")}>
              <KeyIcon className="h-5 w-5" />
            </button>
            <button onClick={toggle} className={iconBtn} aria-label="Toggle dark mode" title={dark ? "Light mode" : "Dark mode"}>
              {dark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            <Bell />
            <Menu
              placement="bottom end"
              trigger={
                <TriggerLabel tone="pill">
                  <UserIcon className="h-4 w-4" />
                  <span>{APP.userName} · {app.me.label}</span>
                  <ChevronDownIcon className="h-4 w-4" />
                </TriggerLabel>
              }
              items={Object.values(ROLES).map((r) => ({ id: r.key, label: `${r.key === app.role ? "✓ " : ""}Switch to ${r.label}` }))}
              onAction={(id) => {
                app.setRole(id as RoleKey);
                nav("/dashboard");
                toast.success("Role switched", ROLES[id as RoleKey].label);
              }}
            />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex min-h-full flex-col">
            <div className="flex-1 px-6 pb-5">
              <Outlet />
            </div>
            <footer className="flex flex-wrap justify-between gap-3 border-t border-qp-line px-6 py-2.5 text-xs text-qp-mut">
              <span>{APP.product} {APP.version}</span>
              <span>{APP.module} Module · {app.me.stage}</span>
            </footer>
          </div>
        </main>
      </div>

      <Modal
        open={confirmReset}
        title="Reset demo data?"
        onClose={() => setConfirmReset(false)}
        actions={[
          { label: "Cancel", kind: "outline" },
          { label: "Reset", kind: "danger", onClick: () => { onReset?.(); nav("/dashboard"); toast.success("Demo data reset"); } },
        ]}
      >
        <p>This restores the original sample data and clears notifications.</p>
      </Modal>
    </div>
  );
}
