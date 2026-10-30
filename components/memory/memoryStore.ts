/**
 * Memory Book storage: everything stays in this browser on this device (IndexedDB).
 * Photos are resized locally before saving and never leave the device.
 */

export interface Memory {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  note: string;
  photoId: string | null;
  createdAt: number;
  updatedAt: number;
}

export type StoreErrorKind = 'unavailable' | 'quota' | 'invalid-type' | 'too-large' | 'unreadable' | 'unknown';

export class MemoryStoreError extends Error {
  constructor(public kind: StoreErrorKind, message: string) {
    super(message);
    this.name = 'MemoryStoreError';
  }
}

/** Plain-language explanations for each failure. */
export const errorMessage = (kind: StoreErrorKind): string =>
  ({
    unavailable: "This browser isn't letting TΛVY save anything (private browsing or blocked site data). Your memories can't be kept here.",
    quota: 'There isn’t enough storage space on this device to save this. Try a smaller photo, or delete an older memory.',
    'invalid-type': 'That file isn’t a supported photo. Please choose a JPEG, PNG, WebP or GIF image.',
    'too-large': 'That photo is too large (over 15 MB). Please choose a smaller image.',
    unreadable: 'That photo couldn’t be read. It may be damaged, or in a format this browser can’t open.',
    unknown: 'Something went wrong while saving. Your other memories are safe; please try again.',
  })[kind];

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
/** Longest edge of the stored photo, in px. */
const MAX_EDGE = 1600;

const DB_NAME = 'tavy-memory-book';
const DB_VERSION = 1;
const MEMORIES = 'memories';
const PHOTOS = 'photos';

const toStoreError = (e: unknown): MemoryStoreError => {
  if (e instanceof MemoryStoreError) return e;
  const name = (e as { name?: string } | null)?.name ?? '';
  if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED') return new MemoryStoreError('quota', errorMessage('quota'));
  if (name === 'SecurityError' || name === 'InvalidStateError') return new MemoryStoreError('unavailable', errorMessage('unavailable'));
  return new MemoryStoreError('unknown', errorMessage('unknown'));
};

let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    let request: IDBOpenDBRequest;
    try {
      if (typeof indexedDB === 'undefined' || !indexedDB) throw new MemoryStoreError('unavailable', errorMessage('unavailable'));
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (e) {
      reject(toStoreError(e));
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MEMORIES)) db.createObjectStore(MEMORIES, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(PHOTOS)) db.createObjectStore(PHOTOS, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new MemoryStoreError('unavailable', errorMessage('unavailable')));
    request.onblocked = () => reject(new MemoryStoreError('unavailable', errorMessage('unavailable')));
  }).catch((e) => {
    dbPromise = null;
    throw e;
  });
  return dbPromise;
};

/** Run one transaction; resolves when it commits, rejects with a MemoryStoreError otherwise. */
const tx = async <T>(stores: string[], mode: IDBTransactionMode, work: (t: IDBTransaction) => T): Promise<T> => {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    let result: T;
    let t: IDBTransaction;
    try {
      t = db.transaction(stores, mode);
      result = work(t);
    } catch (e) {
      reject(toStoreError(e));
      return;
    }
    t.oncomplete = () => resolve(result);
    t.onabort = () => reject(toStoreError(t.error));
    t.onerror = () => reject(toStoreError(t.error));
  });
};

const request = <T>(r: IDBRequest<T>, out: { value?: T }) => {
  r.onsuccess = () => {
    out.value = r.result;
  };
};

/** All memories, oldest concert first. */
export const listMemories = async (): Promise<Memory[]> => {
  const out: { value?: Memory[] } = {};
  await tx([MEMORIES], 'readonly', (t) => request(t.objectStore(MEMORIES).getAll() as IDBRequest<Memory[]>, out));
  return (out.value ?? []).sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
};

export const getPhoto = async (id: string): Promise<Blob | null> => {
  const out: { value?: { id: string; blob: Blob } } = {};
  await tx([PHOTOS], 'readonly', (t) => request(t.objectStore(PHOTOS).get(id) as IDBRequest<{ id: string; blob: Blob }>, out));
  return out.value?.blob ?? null;
};

/** Check a chosen file before any work is done with it. */
export const validatePhoto = (file: File) => {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new MemoryStoreError('invalid-type', errorMessage('invalid-type'));
  if (file.size > MAX_UPLOAD_BYTES) throw new MemoryStoreError('too-large', errorMessage('too-large'));
};

/** Resize to at most MAX_EDGE on the device, as JPEG (GIFs keep their first frame). */
export const preparePhoto = async (file: File): Promise<Blob> => {
  validatePhoto(file);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new MemoryStoreError('unreadable', errorMessage('unreadable'));
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new MemoryStoreError('unreadable', errorMessage('unreadable'));
  ctx.fillStyle = '#ffffff'; // transparent PNGs print on white, like a photo
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86));
  if (!blob) throw new MemoryStoreError('unreadable', errorMessage('unreadable'));
  return blob;
};

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export interface MemoryDraft {
  title: string;
  date: string;
  note: string;
  /** A new photo to store, `null` to remove the current one, or undefined to keep it. */
  photo?: Blob | null;
}

/** Create (no id) or update a memory, with its photo, in one transaction. */
export const saveMemory = async (draft: MemoryDraft, existing?: Memory): Promise<Memory> => {
  const now = Date.now();
  const photoId = draft.photo === undefined ? (existing?.photoId ?? null) : draft.photo ? newId() : null;
  const memory: Memory = {
    id: existing?.id ?? newId(),
    title: draft.title.trim(),
    date: draft.date,
    note: draft.note.trim(),
    photoId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await tx([MEMORIES, PHOTOS], 'readwrite', (t) => {
    if (draft.photo) t.objectStore(PHOTOS).put({ id: photoId, blob: draft.photo });
    if (existing?.photoId && existing.photoId !== photoId) t.objectStore(PHOTOS).delete(existing.photoId);
    t.objectStore(MEMORIES).put(memory);
  });
  return memory;
};

export const deleteMemory = async (memory: Memory) => {
  await tx([MEMORIES, PHOTOS], 'readwrite', (t) => {
    t.objectStore(MEMORIES).delete(memory.id);
    if (memory.photoId) t.objectStore(PHOTOS).delete(memory.photoId);
  });
};

/** Ask the browser to keep this site's storage (best effort; it may say no). */
export const requestPersistence = async () => {
  try {
    if (navigator.storage?.persisted && !(await navigator.storage.persisted())) await navigator.storage.persist?.();
  } catch {
    // Not supported: storage stays "best effort".
  }
};
