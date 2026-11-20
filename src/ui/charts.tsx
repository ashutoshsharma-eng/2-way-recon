/* Lightweight SVG charts themed with QP tokens (colours are text-* classes used via currentColor). */

export interface Slice { label: string; value: number; color: string }

export function Donut({ items, label }: { items: Slice[]; label: string }) {
  const total = items.reduce((a, b) => a + b.value, 0);
  const R = 46, C = 2 * Math.PI * R;
  let off = 0;
  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={`${label}: ${total} total`}>
        <circle r={R} cx="60" cy="60" fill="none" strokeWidth="16" className="stroke-current text-blue-100 dark:text-qp-hover" />
        {items.filter((i) => i.value).map((i) => {
          const len = total ? (i.value / total) * C : 0;
          const el = <circle key={i.label} r={R} cx="60" cy="60" fill="none" stroke="currentColor" strokeWidth="16" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} transform="rotate(-90 60 60)" className={i.color} />;
          off += len;
          return el;
        })}
        <text x="60" y="58" textAnchor="middle" fontSize="22" fontWeight="600" className="fill-current text-qp-ink">{total}</text>
        <text x="60" y="74" textAnchor="middle" fontSize="10" className="fill-current text-qp-mut">total</text>
      </svg>
      <ul className="flex flex-col gap-1.5 text-xs text-qp-ink">
        {items.map((i) => (
          <li key={i.label} className="flex items-center">
            <svg width="10" height="10" className={`mr-1.5 ${i.color}`} aria-hidden><rect width="10" height="10" rx="2" fill="currentColor" /></svg>
            {i.label} · <b className="ml-1 font-semibold">{i.value}</b>
          </li>
        ))}
        {items.length === 0 && <li className="text-qp-mut">No data</li>}
      </ul>
    </div>
  );
}

export function HBars({ items }: { items: Slice[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div>
      {items.map((i) => (
        <div key={i.label} className="my-[7px] flex items-center gap-2.5 text-[13px] text-qp-ink">
          <span className="w-[150px] shrink-0 truncate" title={i.label}>{i.label}</span>
          <span className="h-3.5 flex-1 overflow-hidden rounded bg-blue-100 dark:bg-qp-hover">
            <svg width={`${Math.round((i.value / max) * 100)}%`} height="100%" className={`block ${i.color}`} aria-hidden><rect width="100%" height="100%" rx="4" fill="currentColor" /></svg>
          </span>
          <span className="w-7 shrink-0 text-right font-semibold">{i.value}</span>
        </div>
      ))}
    </div>
  );
}

export interface Series { name: string; color: string; values: number[] }

/** Grouped column chart over month labels. */
export function Columns({ series, labels }: { series: Series[]; labels: string[] }) {
  const W = 420, H = 150, pad = 24;
  const mx = Math.max(1, ...series.flatMap((s) => s.values));
  const bw = (W - pad) / labels.length, g = (bw * 0.7) / series.length;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 22}`} width="100%" role="img" aria-label="Monthly counts">
        <line x1={pad} y1={H} x2={W} y2={H} className="stroke-current text-qp-field" />
        {labels.map((l, i) => (
          <g key={l + i}>
            {series.map((s, j) => {
              const v = s.values[i], h = (v / mx) * (H - 16), x = pad + i * bw + bw * 0.15 + j * g;
              return (
                <g key={s.name} className={s.color}>
                  <rect x={x} y={H - h} width={g - 2} height={h} rx="2" fill="currentColor"><title>{`${l}: ${v} ${s.name}`}</title></rect>
                  {v > 0 && <text x={x + (g - 2) / 2} y={H - h - 3} textAnchor="middle" fontSize="10" className="fill-current text-gray-700 dark:text-gray-300">{v}</text>}
                </g>
              );
            })}
            <text x={pad + i * bw + bw / 2} y={H + 14} textAnchor="middle" fontSize="11" className="fill-current text-qp-mut">{l}</text>
          </g>
        ))}
      </svg>
      {series.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-3.5 text-xs text-qp-ink">
          {series.map((s) => (
            <span key={s.name} className="flex items-center"><svg width="10" height="10" className={`mr-1.5 ${s.color}`} aria-hidden><rect width="10" height="10" rx="2" fill="currentColor" /></svg>{s.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}
