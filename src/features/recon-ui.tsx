/* Small domain widgets shared by the reconciliation pages (built only from src/ui + kraft-component + qp tokens). */
import { useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@quantumphinance/kraft-component";
import { STATUS_COLOR } from "../config";
import { Card } from "../layout/PageHeader";
import { Steps } from "../ui";
import type { Slice } from "../ui/charts";
import { STATUSES } from "./recon-engine";
import type { Summary } from "./recon-engine";

export const WORKFLOW = ["Upload", "Map & Transform", "Reconcile & Export"];

export function WorkflowCard({ current, children }: { current: number; children?: ReactNode }) {
  return (
    <Card className="mb-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="w-full max-w-[560px] min-w-[300px] flex-1"><Steps names={WORKFLOW} current={current} /></div>
        {children}
      </div>
    </Card>
  );
}

/** Outline button that opens a hidden file input (kraft Button has no file mode). */
export function FileButton({ label, accept, onFile, icon, solid }: { label: string; accept: string; onFile: (f: File) => void; icon?: ReactNode; solid?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button size="lg" variant={solid ? "solid" : "outline"} startIcon={icon} onPress={() => ref.current?.click()}>{label}</Button>
      <input ref={ref} type="file" accept={accept} className="hidden" aria-hidden tabIndex={-1}
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onFile(f); }} />
    </>
  );
}

export const statusSlices = (s: Summary): Slice[] => {
  const v: Record<string, number> = {
    Matched: s.matched, "Field Mismatch": s.mismatched, "Missing in B": s.missingInB, "Missing in A": s.missingInA, "Duplicate Key": s.duplicateRows,
  };
  return STATUSES.map((k) => ({ label: k, value: v[k], color: STATUS_COLOR[k] })).filter((x) => x.value);
};

export const pctOf = (n: number, d: number) => (d ? `${((n / d) * 100).toFixed(1)}%` : "–");
export const num = (n: number) => n.toLocaleString("en-IN");
export const sizeText = (b: number) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
