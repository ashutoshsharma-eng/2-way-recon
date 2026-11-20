import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeftIcon, ArrowPathIcon, ArrowsPointingInIcon, ArrowsPointingOutIcon, ChevronRightIcon, ListBulletIcon, StarIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import { APP } from "../config";

/* ------------------------------------------------------------------ */
/* Title bar — every page starts with one (reference app's `.tt`).     */
/* ------------------------------------------------------------------ */

const toolBtn = "flex items-center rounded-md p-1.5 text-qp-ink transition-colors hover:bg-qp-hover";

function useFullscreen() {
  const [full, setFull] = useState(false);
  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };
  return { full, toggle };
}

interface TitleBarProps {
  title: string;
  /** Show the ← back button (default true, like the reference app). */
  back?: boolean;
  /** Status chip(s) shown on the right, before actions. */
  status?: ReactNode;
  /** Buttons on the right of the bar. */
  actions?: ReactNode;
  /** Adds the "View Logs ›" link on the right. */
  onViewLogs?: () => void;
  /** Refresh handler; defaults to reloading the page. */
  onRefresh?: () => void;
  /** Hide refresh / favourite / full-screen icons. */
  hideTools?: boolean;
}

function TitleBar({ title, back = true, status, actions, onViewLogs, onRefresh, hideTools }: TitleBarProps) {
  const nav = useNavigate();
  const [fav, setFav] = useState(false);
  const fs = useFullscreen();
  useEffect(() => { document.title = `${title} · ${APP.module}`; }, [title]);
  return (
    <div className="-mx-6 mb-5 flex flex-wrap items-center gap-3 border-b border-qp-line px-6 pb-3 pt-1.5">
      {back && (
        <button type="button" onClick={() => nav(-1)} aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-lg bg-qp-search text-qp-ink transition-colors hover:bg-qp-hover">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
      )}
      <h1 className="ml-1 mr-2 text-[22px] font-medium text-qp-ink">{title}</h1>
      {!hideTools && (
        <>
          <button type="button" className={toolBtn} aria-label="Refresh" title="Refresh" onClick={onRefresh ?? (() => window.location.reload())}>
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          <button type="button" className={toolBtn} aria-label="Favourite" aria-pressed={fav} title="Favourite" onClick={() => setFav((f) => !f)}>
            {fav ? <StarSolidIcon className="h-5 w-5 text-qp-amber" /> : <StarIcon className="h-5 w-5" />}
          </button>
          <button type="button" className={toolBtn} aria-label={fs.full ? "Exit full screen" : "Full screen"} title="Full screen" onClick={fs.toggle}>
            {fs.full ? <ArrowsPointingInIcon className="h-5 w-5" /> : <ArrowsPointingOutIcon className="h-5 w-5" />}
          </button>
        </>
      )}
      {(status || actions || onViewLogs) && (
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {status}
          {actions}
          {onViewLogs && (
            <button type="button" onClick={onViewLogs} className="flex items-center gap-1.5 p-1.5 text-[15px] text-qp-blue hover:underline">
              <ListBulletIcon className="h-5 w-5" /> View Logs <ChevronRightIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** List / dashboard pages: title bar + optional muted description line under it. */
export function PageHeader({ title, description, actions, back, status, onViewLogs }: {
  title: string; description?: ReactNode; actions?: ReactNode; back?: boolean; status?: ReactNode; onViewLogs?: () => void;
}) {
  return (
    <>
      <TitleBar title={title} back={back} status={status} actions={actions} onViewLogs={onViewLogs} />
      {description && <p className="-mt-1 mb-4 text-sm text-qp-mut">{description}</p>}
    </>
  );
}

/** Form / detail pages: back button + title + status chip + actions (+ optional View Logs). */
export function PageTitleBar(props: TitleBarProps) {
  return <TitleBar {...props} />;
}

/* ------------------------------------------------------------------ */
/* Content blocks                                                     */
/* ------------------------------------------------------------------ */

/** Pale-blue content card (reference `.cd`). */
export function Card({ title, actions, children, className = "" }: { title?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg bg-qp-card px-6 py-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-3.5 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-semibold text-qp-ink">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const statTone = {
  blue: "border-l-qp-blue",
  amber: "border-l-qp-amber",
  purple: "border-l-qp-purple",
  green: "border-l-qp-green",
  red: "border-l-qp-red",
} as const;
export type StatTone = keyof typeof statTone;

/** KPI tile with a coloured left edge (reference `.kpi`). Clickable when `onClick` is given. */
export function StatCard({ label, value, hint, tone = "blue", onClick }: {
  label: string; value: ReactNode; hint?: string; tone?: StatTone; onClick?: () => void;
}) {
  const cls = `rounded-lg border-l-4 bg-qp-card px-4 py-3.5 text-left ${statTone[tone]} ${onClick ? "cursor-pointer transition-colors hover:bg-qp-hover" : ""}`;
  const body = (
    <>
      <div className="text-[28px] font-semibold leading-tight text-qp-ink">{value}</div>
      <div className="mt-1 text-xs text-qp-mut">{label}</div>
      {hint && <div className="mt-0.5 text-[11px] text-qp-mut">{hint}</div>}
    </>
  );
  return onClick ? <button type="button" onClick={onClick} className={cls}>{body}</button> : <div className={cls}>{body}</div>;
}

export interface Column<T> { key: keyof T & string; header: string; align?: "left" | "right"; render?: (row: T) => ReactNode }

/** Themed table (kraft-component 1.1.0 does not export a data grid). Reference `.tbl`. */
export function DataTable<T extends { id: string | number }>({ columns, rows, onRowClick, empty = "No records" }: {
  columns: Column<T>[]; rows: T[]; onRowClick?: (row: T) => void; empty?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-qp-line bg-qp-surface">
      <table className="w-full border-collapse text-left text-[13px]">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`whitespace-nowrap border-b border-qp-line bg-gray-50 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-qp-mut dark:bg-qp-card ${c.align === "right" ? "text-right" : ""}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="px-3 py-6 text-center text-qp-mut">{empty}</td></tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} onClick={onRowClick && (() => onRowClick(r))} className={`transition-colors hover:bg-qp-hover ${onRowClick ? "cursor-pointer" : ""}`}>
              {columns.map((c) => (
                <td key={c.key} className={`border-b border-qp-line/60 px-3 py-[9px] align-middle text-qp-ink ${c.align === "right" ? "text-right tabular-nums" : ""}`}>
                  {c.render ? c.render(r) : String(r[c.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Horizontal bar row for simple "by type" charts (reference `.hb`). */
export function BarRow({ label, value, max, colorClass = "bg-qp-blue" }: { label: string; value: number; max: number; colorClass?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="my-[7px] flex items-center gap-2.5 text-[13px] text-qp-ink">
      <span className="w-[150px] shrink-0 truncate">{label}</span>
      <span className="h-3.5 flex-1 overflow-hidden rounded bg-blue-100 dark:bg-qp-hover">
        <span className={`block h-full rounded ${colorClass}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="w-7 shrink-0 text-right font-semibold">{value}</span>
    </div>
  );
}
