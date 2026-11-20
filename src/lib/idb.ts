/* Tiny IndexedDB key-value store. Used to keep the working session (uploaded files, parsed rows, last result) in THIS browser
   across page reloads — large datasets do not fit in localStorage. Nothing is ever sent to a server. All calls fail soft. */
const DB = "two-way-recon";
const STORE = "kv";

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T | undefined> {
  try {
    const db = await open();
    return await new Promise<T>((res, rej) => {
      const t = db.transaction(STORE, mode);
      const req = fn(t.objectStore(STORE));
      t.oncomplete = () => { db.close(); res(req.result as T); };
      t.onerror = () => { db.close(); rej(t.error); };
    });
  } catch {
    return undefined;
  }
}

export const idbGet = <T>(key: string) => tx<T>("readonly", (s) => s.get(key));
export const idbSet = (key: string, value: unknown) => tx("readwrite", (s) => s.put(value, key));
export const idbDel = (key: string) => tx("readwrite", (s) => s.delete(key));
