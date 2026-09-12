import { DBSchema, IDBPDatabase, deleteDB, openDB } from 'idb';
import { Doc, emptyDoc, newDocId } from '@/lib/doc/types';

const DB_NAME = 'presupuestafy';
// Single object store, no indexes — the library is small enough to scan and
// sort in memory. If an older DB exists at a higher version (from a previous
// schema), delete it once: IndexedDB versions can't go down.
const DB_VERSION = 1;
const STORE = 'docs';

/** Fired after any write (save/rename/duplicate/delete) so the dashboard
 *  sidebar's document list can refresh without polling — it renders in a
 *  layout that persists across navigations, so it has no other way to learn
 *  about writes a page component makes (e.g. the active doc's autosave). */
export const DOCS_CHANGED_EVENT = 'presupuestafy:docs-changed';

function notifyDocsChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(DOCS_CHANGED_EVENT));
}

interface DocsDB extends DBSchema {
  docs: {
    key: string;
    value: Doc;
  };
}

/** Slim projection for list views — callers that only need to render a row
 *  shouldn't have to hold every document's full body in memory at once. */
export type DocSummary = {
  id: string;
  name: string;
  clientName: string;
  updatedAt: number;
};

function summarize(doc: Doc): DocSummary {
  return {
    id: doc.id,
    name: doc.body.name,
    clientName: doc.body.to.name,
    updatedAt: doc.updatedAt
  };
}

/** Some browsers expose `indexedDB` but can't actually use it: Firefox with
 *  history/cookies fully blocked throws on open or on the first transaction,
 *  and a private window can open the DB but reject every write with
 *  `QuotaExceededError`. A read-only check misses that last case, so this
 *  round-trips a write + read + delete against a throwaway DB (isolated, so
 *  it never touches the real `docs` store). Memoised — runs once per load. */
let storageProbe: Promise<boolean> | null = null;

export function isStorageAvailable(): Promise<boolean> {
  storageProbe ??= (async () => {
    if (typeof indexedDB === 'undefined') return false;
    try {
      const probe = await openDB('presupuestafy-probe', 1, {
        upgrade: d => void d.createObjectStore('t')
      });
      await probe.put('t', 1, 'k');
      await probe.get('t', 'k');
      probe.close();
      await deleteDB('presupuestafy-probe').catch(() => {});
      return true;
    } catch {
      return false;
    }
  })();
  return storageProbe;
}

let dbPromise: Promise<IDBPDatabase<DocsDB>> | null = null;

function getDb(): Promise<IDBPDatabase<DocsDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DocsDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    });
  }
  return dbPromise;
}

/** Every saved document in full, **most recently created first** — a stable
 *  order the list doesn't reshuffle every time a doc is opened or autosaved
 *  (that's what sorting by `updatedAt` would do). The library is small enough
 *  to sort in memory; there's no `by-createdAt` index. */
export async function getAllDocs(): Promise<Doc[]> {
  const db = await getDb();
  const all = await db.getAll(STORE);
  all.sort((a, b) => b.createdAt - a.createdAt || b.updatedAt - a.updatedAt);
  return all;
}

/** `getAllDocs`, projected to lightweight row summaries for the sidebar. */
export async function listDocs(): Promise<DocSummary[]> {
  return (await getAllDocs()).map(summarize);
}

export async function getDoc(id: string): Promise<Doc | undefined> {
  const db = await getDb();
  return db.get(STORE, id);
}

/** The document the bare `/editor` route opens to: the most recently created
 *  one — the same doc that sits at the top of `listDocs()`, so the route and
 *  the sidebar's active-row highlight always agree. */
export async function getMostRecentDoc(): Promise<Doc | undefined> {
  return (await getAllDocs())[0];
}

/** Next free "NNN" number: one past the highest numeric prefix already in use
 *  (so `001`, `002`, … and no collision after a delete), three-digit
 *  zero-padded. Free-typed numbers that don't start with a digit are ignored. */
export async function nextDocNumber(): Promise<string> {
  const db = await getDb();
  const all = await db.getAll(STORE);
  const highest = all.reduce((max, d) => {
    const n = parseInt(d.body.name, 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return String(highest + 1).padStart(3, '0');
}

/** Creates a fresh document, gives it the next free number, and persists it.
 *  The single entry point for "new document" — the sidebar button and the
 *  home CTA both go through here. */
export async function createDoc(): Promise<Doc> {
  const doc = emptyDoc();
  doc.body.name = await nextDocNumber();
  return saveDoc(doc);
}

/** Upserts a document, always stamping `updatedAt`. Callers debounce this
 *  themselves (autosave-on-every-keystroke would otherwise hit IndexedDB on
 *  every keystroke) — this function itself does one write per call. */
export async function saveDoc(doc: Doc): Promise<Doc> {
  const db = await getDb();
  const stamped: Doc = { ...doc, updatedAt: Date.now() };
  await db.put(STORE, stamped);
  notifyDocsChanged();
  return stamped;
}

/** Renames a document in place — the library's own action, same as editing
 *  `body.name` inside the document itself (it's the same field). */
export async function renameDoc(id: string, name: string): Promise<Doc | undefined> {
  const doc = await getDoc(id);
  if (!doc) return undefined;
  return saveDoc({ ...doc, body: { ...doc.body, name } });
}

export async function deleteDoc(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
  notifyDocsChanged();
}

/** Bulk delete — the sidebar's multi-select action. One transaction and a
 *  single `DOCS_CHANGED_EVENT` so the list repaints once, not N times. */
export async function deleteManyDocs(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  const tx = db.transaction(STORE, 'readwrite');
  await Promise.all(ids.map(id => tx.store.delete(id)));
  await tx.done;
  notifyDocsChanged();
}

export async function duplicateDoc(id: string): Promise<Doc | undefined> {
  const original = await getDoc(id);
  if (!original) return undefined;
  const now = Date.now();
  const copy: Doc = {
    ...original,
    id: newDocId(),
    body: { ...original.body, name: `${original.body.name} (copia)` },
    createdAt: now,
    updatedAt: now
  };
  const db = await getDb();
  await db.put(STORE, copy);
  notifyDocsChanged();
  return copy;
}
