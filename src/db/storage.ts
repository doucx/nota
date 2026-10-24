import type { AppMeta, NoteStats, SessionRecord } from '@/types';
import { entries, get, set } from 'idb-keyval';

export const SCHEMA_VERSION = 1;

const DB_NAME = 'nota-db';
const STORE_NAME = 'nota';
// 由 1 升级到 2，以修复历史版本中缺失的 object store
const DB_VERSION = 2;
const LEGACY_OPTIONS_KEY = 'nota_trainer_options_v1';

const META_KEY = 'meta:app';
const STATS_PREFIX = 'stat:';
const SESSION_PREFIX = 'session:';

/**
 * 与 idb-keyval 的 UseStore 结构一致。
 * 使用带版本号的显式 open，确保在旧数据库上补齐缺失的 object store。
 */
type UseStore = <T>(
  txMode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => T | PromiseLike<T>,
) => Promise<T>;

const dbp = new Promise<IDBDatabase>((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, DB_VERSION);
  req.onupgradeneeded = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME);
    }
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const store: UseStore = (txMode, callback) =>
  dbp.then((db) => callback(db.transaction(STORE_NAME, txMode).objectStore(STORE_NAME)));

let initialized = false;

export async function initStorage(): Promise<void> {
  if (initialized) return;
  initialized = true;

  try {
    localStorage.removeItem(LEGACY_OPTIONS_KEY);
  } catch {
    // 忽略隐私模式等不可用异常
  }

  const meta = await get<AppMeta>(META_KEY, store);
  if (!meta) {
    await set(META_KEY, { schemaVersion: SCHEMA_VERSION }, store);
  } else if (meta.schemaVersion !== SCHEMA_VERSION) {
    await set(META_KEY, { ...meta, schemaVersion: SCHEMA_VERSION }, store);
  }
}

export async function getMeta(): Promise<AppMeta | undefined> {
  return get<AppMeta>(META_KEY, store);
}

export async function setMeta(patch: Partial<AppMeta>): Promise<void> {
  const current = (await getMeta()) ?? { schemaVersion: SCHEMA_VERSION };
  await set(META_KEY, { ...current, ...patch }, store);
}

export async function getAllNoteStats(): Promise<Record<string, NoteStats>> {
  const all = await entries<string, NoteStats>(store);
  const result: Record<string, NoteStats> = {};
  for (const [key, value] of all) {
    if (key.startsWith(STATS_PREFIX)) {
      result[key.slice(STATS_PREFIX.length)] = value;
    }
  }
  return result;
}

export async function putNoteStatsBatch(batch: Record<string, NoteStats>): Promise<void> {
  const jobs: Promise<void>[] = [];
  for (const [key, value] of Object.entries(batch)) {
    jobs.push(set(`${STATS_PREFIX}${key}`, value, store));
  }
  await Promise.all(jobs);
}

export async function addSession(record: SessionRecord): Promise<void> {
  await set(`${SESSION_PREFIX}${record.id}`, record, store);
}

export async function getAllSessions(): Promise<SessionRecord[]> {
  const all = await entries<string, SessionRecord>(store);
  const result: SessionRecord[] = [];
  for (const [key, value] of all) {
    if (key.startsWith(SESSION_PREFIX)) {
      result.push(value);
    }
  }
  return result;
}
