// Minimal IndexedDB key/value cache (simulation results survive reloads). Fails soft: no IDB → no cache.
const DB = 'wordle-lab', STORE = 'cache'
let dbp: Promise<IDBDatabase | null> | null = null
function db() {
  if (!dbp) dbp = new Promise(res => {
    try { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(STORE); r.onsuccess = () => res(r.result); r.onerror = () => res(null) } catch { res(null) }
  })
  return dbp
}
export async function idbGet<T>(key: string): Promise<T | undefined> {
  const d = await db(); if (!d) return undefined
  return new Promise(res => { try { const q = d.transaction(STORE).objectStore(STORE).get(key); q.onsuccess = () => res(q.result as T); q.onerror = () => res(undefined) } catch { res(undefined) } })
}
export async function idbSet(key: string, v: unknown): Promise<void> {
  const d = await db(); if (!d) return
  return new Promise(res => { try { const tx = d.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(v, key); tx.oncomplete = () => res(); tx.onerror = () => res() } catch { res() } })
}
