import { createElement } from "react";
import type { ReactNode } from "react";
import { HomeIcon, SwatchIcon } from "@heroicons/react/24/outline";
import type { NavItem } from "@quantumphinance/kraft-component";
import type { Tone } from "./ui";

/**
 * ===== EDIT THIS FILE FIRST when starting a new app =====
 * Brand, module name, roles, sidebar, status colours. Nav item `id` === route path (no leading slash).
 * Everything else (shell, header, tokens, components) is the uniform design system — do not restyle it.
 */
export const APP = {
  logo: "/logo.webp",          // light-mode logo (Quantum Phinance — keep)
  logoDark: "/logo-dark.png",  // dark-mode logo (keep)
  product: "SheetKraft",       // footer, left: "<product> <version>"
  version: "1.0.0",
  module: "Sample App",        // module name under the logo card  <- CHANGE
  userName: "Demo User",       // header user pill: "<userName> · <role>"
  searchPlaceholder: "Search records, then press Enter",
  searchRoute: "/records",     // global search navigates to `${searchRoute}?q=...`
};

/**
 * Demo roles (switch from the user menu, top right). Keep one entry if the app has no roles.
 * `stage` shows in the footer, right: "<module> Module · <stage>".
 */
export const ROLES = {
  maker: { key: "maker", label: "Maker", stage: "Initiator" },
  checker: { key: "checker", label: "Checker", stage: "Reviewer" },
} as const;
export type RoleKey = keyof typeof ROLES;
export const DEFAULT_ROLE: RoleKey = "maker";

/** Status -> chip colour. Use: <StatusChip status="Approved" tones={STATUS_TONE} />. */
export const STATUS_TONE: Record<string, Tone> = {
  Draft: "slate",
  Pending: "amber",
  "In Review": "purple",
  "Sent Back": "orange",
  Approved: "green",
  Rejected: "red",
};
/** Same statuses as chart colours (text-* class, drawn with currentColor). */
export const STATUS_COLOR: Record<string, string> = {
  Draft: "text-slate-400 dark:text-slate-500",
  Pending: "text-qp-amber",
  "In Review": "text-qp-purple",
  "Sent Back": "text-orange-500 dark:text-orange-400",
  Approved: "text-qp-green",
  Rejected: "text-qp-red",
};

/** Green lettered square used as sub-menu icon (A / D / M / T ...), as in the SheetKraft sidebar. */
const letter = (l: string): ReactNode =>
  createElement("span", {
    className:
      "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded border-[1.5px] border-qp-green text-xs font-semibold text-qp-green",
  }, l);

/** Leaf item: lettered icon + label (+ optional blue count badge). */
export const item = (id: string, l: string, label: string, badge?: number): NavItem => ({ id, label, icon: letter(l), ...(badge ? { badge } : {}) });
/** Group item: green -/+ box with tree line. */
export const group = (id: string, label: string, children: NavItem[]): NavItem => ({ id, label, children });

/** Sidebar. Home is always first. Max ~6 top-level entries. `counts` feeds badges (e.g. pending tray). */
export function buildNav(role: RoleKey, counts: Record<string, number> = {}): NavItem[] {
  const home: NavItem = { id: "dashboard", label: "Home", icon: createElement(HomeIcon, { className: "w-4 h-4" }) };
  const records = group("rec", "Records", [
    item("records", "R", "All Records", counts.records),
    ...(role === "maker" ? [item("records/new", "N", "New Record")] : []),
  ]);
  const reports = group("rep", "Reports", [item("reports/summary", "S", "Summary Report")]);
  const admin = group("adm", "Admin", [
    item("import", "U", "Data Import"),
    item("reset", "X", "Reset Demo Data"),
  ]);
  const guide: NavItem = { id: "design-system", label: "Design System", icon: createElement(SwatchIcon, { className: "w-4 h-4" }) };
  return [home, records, reports, admin, guide]; // remove `guide` before handing the app to end users
}

/** Which sidebar item is highlighted for a route (detail pages light up their parent). */
export function activeNavFor(path: string): string {
  const p = path.replace(/^\//, "");
  if (p.startsWith("records/") && p !== "records/new") return "records";
  return p || "dashboard";
}

/** Sidebar groups that start expanded. */
export const OPEN_GROUPS = ["rec"];
