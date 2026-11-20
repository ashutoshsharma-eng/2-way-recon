/* Uniform UI kit for every app built on this template. Built on kraft-component tokens (labelCls, inputCls …) and the QP theme.
   Import from "../ui". Do not re-create these in pages. */
import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button, StepProgress, errorCls, helperCls, inputCls, labelCls } from "@quantumphinance/kraft-component";
import { ArrowUpTrayIcon, XMarkIcon } from "@heroicons/react/24/outline";

/* ------------------------------ chips ------------------------------ */
const TONE = {
  blue: "bg-blue-50 text-qp-bluetext dark:bg-blue-950/60",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  purple: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  slate: "bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200",
  green: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  red: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
} as const;
export type Tone = keyof typeof TONE;

export function Pill({ tone = "blue", children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return <span title={title} className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-medium ${TONE[tone]}`}>{children}</span>;
}

/** Map YOUR status names to a tone once (`STATUS_TONE` in src/config.ts), then render with <StatusChip/>. */
export function StatusChip({ status, tones }: { status: string; tones: Record<string, Tone> }) {
  return <Pill tone={tones[status] ?? "slate"}>{status}</Pill>;
}

/* --------------------------- small blocks --------------------------- */

export function KV({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(110px,150px)_1fr] gap-x-4 gap-y-2.5 text-[13px]">
      {rows.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="text-qp-mut">{k}</dt>
          <dd className="min-w-0 break-words text-qp-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Banner({ tone = "warn", children, className = "" }: { tone?: "warn" | "info"; children: ReactNode; className?: string }) {
  const cls = tone === "info"
    ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50"
    : "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40";
  return <div className={`rounded-lg border px-4 py-3 text-[13px] text-qp-ink ${cls} ${className}`}>{children}</div>;
}

export const SectionTitle = ({ children }: { children: ReactNode }) => <h3 className="mb-2 mt-[18px] text-sm font-semibold text-qp-ink first:mt-0">{children}</h3>;

/** Workflow stepper (Initiated → Review → Approved …). */
export function Steps({ names, current }: { names: string[]; current: number }) {
  return (
    <div className="max-w-[560px]">
      <StepProgress steps={names} currentStep={current} />
    </div>
  );
}

/* ------------------------------ table ------------------------------ */

export function Tbl({ heads, children, empty = "No records found", colSpan }: { heads: ReactNode[]; children?: ReactNode; empty?: string; colSpan?: number }) {
  const has = Array.isArray(children) ? children.flat().filter(Boolean).length > 0 : !!children;
  return (
    <div className="overflow-x-auto rounded-lg border border-qp-line bg-qp-surface">
      <table className="w-full border-collapse text-left text-[13px]">
        <thead>
          <tr>
            {heads.map((h, i) => (
              <th key={i} className="whitespace-nowrap border-b border-qp-line bg-gray-50 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-qp-mut dark:bg-qp-card">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {has ? children : (
            <tr><td colSpan={colSpan ?? heads.length} className="px-3 py-6 text-center text-qp-mut">{empty}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Tr({ children, onClick, tone }: { children: ReactNode; onClick?: () => void; tone?: "changed" | "selected" | "group" }) {
  const bg = tone === "changed" ? "bg-amber-50 dark:bg-amber-950/30" : tone === "selected" ? "bg-blue-50 dark:bg-blue-950/50" : tone === "group" ? "bg-blue-50/70 font-semibold dark:bg-qp-card" : "";
  return (
    <tr onClick={onClick} className={`${bg} ${onClick ? "cursor-pointer hover:bg-qp-hover" : ""} transition-colors`}>{children}</tr>
  );
}
export function Td({ children, right, nowrap, colSpan }: { children?: ReactNode; right?: boolean; nowrap?: boolean; colSpan?: number }) {
  return <td colSpan={colSpan} className={`border-b border-qp-line/60 px-3 py-[9px] align-middle text-qp-ink ${right ? "text-right tabular-nums" : ""} ${nowrap ? "whitespace-nowrap" : ""}`}>{children}</td>;
}

/* ------------------------------ tabs ------------------------------ */

export function TabBar({ tabs, active, onChange }: { tabs: { id: string; label: string; count?: number }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div role="tablist" className="mb-3.5 flex flex-wrap gap-1 border-b border-qp-line">
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button key={t.id} type="button" role="tab" aria-selected={on} onClick={() => onChange(t.id)}
            className={`-mb-px border-b-2 px-3.5 py-2 text-[13px] transition-colors ${on ? "border-qp-blue font-semibold text-qp-blue" : "border-transparent text-qp-mut hover:text-qp-ink"}`}>
            {t.label}
            {t.count !== undefined && <span className="ml-1.5 rounded-full bg-blue-100 px-[7px] text-[11px] text-slate-700 dark:bg-qp-hover dark:text-gray-300">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ----------------------- modal and drawer ----------------------- */

export interface ModalAction { label: string; kind?: "solid" | "outline" | "danger"; onClick?: () => void | boolean }

/** Controlled dialog. An action that returns `false` keeps the dialog open. */
export function Modal({ open, title, children, actions, onClose }: { open: boolean; title: string; children: ReactNode; actions: ModalAction[]; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    const first = box.current?.querySelector<HTMLElement>("input,textarea,select,button");
    first?.focus();
    return () => document.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden />
      <div ref={box} role="dialog" aria-modal="true" aria-label={title}
        className="absolute left-1/2 top-1/2 max-h-[90vh] w-[min(520px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-[10px] bg-qp-surface px-6 py-[22px] text-qp-ink shadow-2xl">
        <h2 className="mb-3 text-lg font-semibold">{title}</h2>
        <div className="text-sm">{children}</div>
        <div className="mt-[18px] flex justify-end gap-2.5">
          {actions.map((a) => (
            <Button key={a.label} size="lg" variant={a.kind === "solid" ? "solid" : "outline"} color={a.kind === "danger" ? "danger" : "primary"}
              onPress={() => { if (!a.onClick || a.onClick() !== false) onClose(); }}>
              {a.label}
            </Button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, title, wide, onClose, children }: { open: boolean; title: string; wide?: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden />
      <aside aria-label={title} className={`absolute inset-y-0 right-0 overflow-auto bg-qp-surface px-6 py-5 text-qp-ink shadow-2xl ${wide ? "w-[min(1040px,100%)]" : "w-[min(540px,100%)]"}`}>
        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1.5 hover:bg-qp-hover"><XMarkIcon className="h-5 w-5" /></button>
        </div>
        {children}
      </aside>
    </div>,
    document.body,
  );
}

/* --------------------- controlled form fields --------------------- */

interface FieldProps { label: string; required?: boolean; help?: ReactNode; error?: string; className?: string }

export function Field({ label, required, help, error, className = "", htmlFor, children }: FieldProps & { htmlFor?: string; children: ReactNode }) {
  return (
    <div className={`flex w-full flex-col gap-1 ${className}`} data-error={error ? "true" : undefined}>
      {label && (
        <label htmlFor={htmlFor} className={labelCls}>
          {label}{required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {help && !error && <div className={helperCls}>{help}</div>}
      {error && <div className={errorCls} role="alert">{error}</div>}
    </div>
  );
}

const errIn = (e?: string) => (e ? "!border-red-600 !bg-red-50 dark:!bg-red-950/30" : "");

export function TextInput({ value, onChange, placeholder, disabled, readOnly, upper, maxLength, ...f }: FieldProps & {
  value: string; onChange?: (v: string) => void; placeholder?: string; disabled?: boolean; readOnly?: boolean; upper?: boolean; maxLength?: number;
}) {
  const id = useId();
  return (
    <Field {...f} htmlFor={id} required={f.required && !disabled}>
      <input id={id} value={value} placeholder={placeholder} disabled={disabled} readOnly={readOnly} maxLength={maxLength}
        aria-invalid={!!f.error} aria-required={f.required}
        onChange={(e) => onChange?.(upper ? e.target.value.toUpperCase() : e.target.value)}
        className={`${inputCls(!!f.error, !!disabled, !!readOnly)} ${errIn(f.error)} ${upper ? "uppercase" : ""}`} />
    </Field>
  );
}

export function SelectInput({ value, onChange, options, blank = "Select", disabled, ...f }: FieldProps & {
  value: string; onChange: (v: string) => void; options: (string | [string, string])[]; blank?: string | false; disabled?: boolean;
}) {
  const id = useId();
  return (
    <Field {...f} htmlFor={id} required={f.required && !disabled}>
      <select id={id} value={value} disabled={disabled} aria-invalid={!!f.error} onChange={(e) => onChange(e.target.value)}
        className={`${inputCls(!!f.error, !!disabled, false, false, true)} ${errIn(f.error)}`}>
        {blank !== false && <option value="">{blank}</option>}
        {options.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return <option key={v} value={v}>{l}</option>; })}
      </select>
    </Field>
  );
}

export function DateInput({ value, onChange, min, disabled, ...f }: FieldProps & { value: string; onChange: (v: string) => void; min?: string; disabled?: boolean }) {
  const id = useId();
  return (
    <Field {...f} htmlFor={id} required={f.required && !disabled}>
      <input id={id} type="date" value={value} min={min} disabled={disabled} aria-invalid={!!f.error} onChange={(e) => onChange(e.target.value)}
        className={`${inputCls(!!f.error, !!disabled, false)} ${errIn(f.error)} dark:[color-scheme:dark]`} />
    </Field>
  );
}

export function TextArea({ value, onChange, placeholder, rows = 4, ...f }: FieldProps & { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  const id = useId();
  return (
    <Field {...f} htmlFor={id}>
      <textarea id={id} value={value} placeholder={placeholder} rows={rows} aria-invalid={!!f.error} onChange={(e) => onChange(e.target.value)}
        className={`${inputCls(!!f.error, false, false)} ${errIn(f.error)} !h-auto resize-y py-2`} />
    </Field>
  );
}

export function CheckboxInput({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px] text-qp-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--qp-blue))]" />
      {label}
    </label>
  );
}

/* ------------------------- supporting documents ------------------------- */

/** Drag-and-drop file picker. Only file names are kept (no backend). `accept` e.g. [".pdf", ".xlsx"]. */
export function FileDrop({ files, onChange, accept = [".pdf", ".png", ".jpg", ".xlsx", ".csv", ".docx"], label = "Supporting Documents (optional)" }: {
  files: string[]; onChange: (names: string[]) => void; accept?: string[]; label?: string;
}) {
  const [over, setOver] = useState(false);
  const [bad, setBad] = useState<string[]>([]);
  const id = useId();
  const take = (list: FileList | null) => {
    if (!list) return;
    const ok: string[] = [], no: string[] = [];
    Array.from(list).forEach((f) => (accept.includes("." + (f.name.split(".").pop() || "").toLowerCase()) ? ok : no).push(f.name));
    setBad(no);
    if (ok.length) onChange([...files, ...ok.filter((n) => !files.includes(n))]);
  };
  return (
    <div className="mt-5 flex w-full flex-col gap-1">
      <span className={labelCls}>{label}</span>
      <label htmlFor={id}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed py-5 transition-colors ${over ? "border-qp-blue bg-blue-50 dark:bg-blue-950/40" : "border-gray-200 bg-qp-surface dark:border-gray-700"}`}>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-qp-mut dark:bg-gray-800"><ArrowUpTrayIcon className="h-5 w-5" /></span>
        <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">Drag files here or <span className="text-qp-blue">browse</span></span>
        <span className="text-xs text-qp-mut">{accept.join(" ")}</span>
        <input id={id} type="file" multiple accept={accept.join(",")} className="hidden" onChange={(e) => { take(e.target.files); e.target.value = ""; }} />
      </label>
      {files.length > 0 && (
        <ul className="mt-1.5 flex flex-col gap-1 text-xs">
          {files.map((n) => (
            <li key={n} className="flex items-center justify-between rounded border border-qp-line bg-qp-surface px-2 py-1 text-qp-ink">
              {n}
              <button type="button" aria-label={`Remove ${n}`} onClick={() => onChange(files.filter((x) => x !== n))} className="rounded p-0.5 text-qp-mut hover:text-qp-red"><XMarkIcon className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
      {bad.length > 0 && <div className={errorCls} role="alert">Not allowed: {bad.join(", ")}. Allowed: {accept.join(" ")}</div>}
    </div>
  );
}
