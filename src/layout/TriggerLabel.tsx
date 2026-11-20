import type { ReactNode } from "react";

/**
 * Dialog / Menu / Tooltip / ProgressDialog in kraft-component wrap `trigger`/`children` in their own <button>.
 * NEVER pass <Button> (or any <button>) there — it nests buttons. Pass this styled <span> instead.
 * Sizes match kraft-component <Button> (h-10 px-5 text-sm) so triggers line up with real buttons.
 */
const tones = {
  primary: "rounded-md h-10 px-5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400",
  outline: "rounded-md h-10 px-5 text-sm font-medium border border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950",
  "outline-gray": "rounded-md h-10 px-5 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800",
  "outline-danger": "rounded-md h-10 px-5 text-sm font-medium border border-red-600 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-950",
  icon: "rounded-md p-1.5 text-qp-ink hover:bg-qp-hover",
  /** Header user pill: "Name · Role ▾" */
  pill: "rounded-[10px] bg-gray-50 px-4 py-2 text-sm text-qp-ink hover:bg-qp-hover dark:bg-qp-search",
} as const;

export function TriggerLabel({ tone = "primary", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={`inline-flex items-center justify-center gap-2 transition-colors ${tones[tone]}`}>{children}</span>;
}
