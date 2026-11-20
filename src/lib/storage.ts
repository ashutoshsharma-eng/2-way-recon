import { useCallback, useEffect, useState } from "react";

const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } };
export const clearKey = (k: string) => { try { localStorage.removeItem(k); } catch { /* storage unavailable */ } };

/** useState that persists to localStorage (the template has no backend). Bump the key version when the shape changes. */
export function usePersistentState<T>(key: string, initial: () => T): [T, (v: T | ((p: T) => T)) => void, () => void] {
  const [val, setVal] = useState<T>(() => {
    try { const s = read(key); if (s) return JSON.parse(s) as T; } catch { /* corrupt: fall back */ }
    return initial();
  });
  useEffect(() => { write(key, JSON.stringify(val)); }, [key, val]);
  const reset = useCallback(() => { clearKey(key); setVal(initial()); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return [val, setVal, reset];
}
