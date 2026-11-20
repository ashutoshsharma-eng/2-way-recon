const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** 05 Mar 2026 — the only date format used in the UI. */
export const fmt = (v?: string | null) => {
  if (!v) return "–";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return `${String(d.getDate()).padStart(2, "0")} ${MON[d.getMonth()]} ${d.getFullYear()}`;
};
/** 05 Mar 2026, 14:05 */
export const fmtDT = (v: string) => {
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return `${fmt(v)}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
export const today = () => new Date().toISOString().slice(0, 10);
/** Indian grouping: 12,34,567.00 — use for every amount column. */
export const inr = (n: number, dp = 2) => n.toLocaleString("en-IN", { minimumFractionDigits: dp, maximumFractionDigits: dp });
export const pct = (n: number, dp = 1) => `${n.toFixed(dp)}%`;
export const monthKey = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
export const lastMonths = (n: number) => {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: monthKey(d.toISOString()), label: `${MON[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` });
  }
  return out;
};
