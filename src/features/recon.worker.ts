/* Runs the reconciliation off the main thread so the UI stays responsive on large files. */
import { reconcile } from "./recon-engine";
import type { Dataset, ReconConfig } from "./recon-engine";

self.onmessage = (e: MessageEvent<{ a: Dataset; b: Dataset; cfg: ReconConfig }>) => {
  try {
    const { a, b, cfg } = e.data;
    self.postMessage({ ok: true, result: reconcile(a, b, cfg) });
  } catch (err) {
    self.postMessage({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
