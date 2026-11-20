import { createElement } from "react";
import type { ReactNode } from "react";
import { HomeIcon } from "@heroicons/react/24/outline";
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
  module: "2-Way Recon",       // module name under the logo card
  userName: "Demo User",       // header user pill: "<userName> · <role>"
  searchPlaceholder: "Search results by key or mismatch reason, then press Enter",
  searchRoute: "/recon/results", // global search navigates to `${searchRoute}?q=...`
};

/**
 * Demo roles (switch from the user menu, top right). Keep one entry if the app has no roles.
 * `stage` shows in the footer, right: "<module> Module · <stage>".
 */
export const ROLES = {
  analyst: { key: "analyst", label: "Recon Analyst", stage: "Reconciliation" },
} as const;
export type RoleKey = keyof typeof ROLES;
export const DEFAULT_ROLE: RoleKey = "analyst";

/** Status -> chip colour. Use: <StatusChip status="Approved" tones={STATUS_TONE} />. */
export const STATUS_TONE: Record<string, Tone> = {
  Matched: "green",
  "Field Mismatch": "amber",
  "Missing in B": "orange",
  "Missing in A": "purple",
  "Duplicate Key": "red",
  Stale: "slate",
  Current: "blue",
};
/** Same statuses as chart colours (text-* class, drawn with currentColor). */
export const STATUS_COLOR: Record<string, string> = {
  Matched: "text-qp-green",
  "Field Mismatch": "text-qp-amber",
  "Missing in B": "text-orange-500 dark:text-orange-400",
  "Missing in A": "text-qp-purple",
  "Duplicate Key": "text-qp-red",
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

/** Sidebar. Home is always first. `counts.exceptions` puts the open-exception count on the Results item. */
export function buildNav(_role: RoleKey, counts: Record<string, number> = {}): NavItem[] {
  const home: NavItem = { id: "dashboard", label: "Home", icon: createElement(HomeIcon, { className: "w-4 h-4" }) };
  const recon = group("rec", "Reconciliation", [
    item("recon/upload", "U", "1 · Upload Datasets"),
    item("recon/map", "M", "2 · Map & Transform"),
    item("recon/results", "R", "3 · Results & Export", counts.exceptions),
  ]);
  const cfg = group("adm", "Configuration", [
    item("templates", "T", "Mapping Templates"),
    item("reset", "X", "Reset Session"),
  ]);
  return [home, recon, cfg];
}

/** Which sidebar item is highlighted for a route (detail pages light up their parent). */
export function activeNavFor(path: string): string {
  const p = path.replace(/^\//, "");
  return p || "dashboard";
}

/** Sidebar groups that start expanded. */
export const OPEN_GROUPS = ["rec", "adm"];
