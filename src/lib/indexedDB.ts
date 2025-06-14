
// Using 'use client' for files with browser-specific APIs like IndexedDB
// when they might be imported by Server Components or 'use server' files.
// However, for a pure lib utility like this, it's often not strictly needed if
// it's only called from client-side code, but good for clarity.
'use client';

import type { FullInspectionData } from './types';

const DB_NAME = 'firecheckDB';
const STORE_NAME = 'inspections';
const DB_VERSION = 1; // Increment this to trigger onupgradeneeded

interface IDBErrorEvent extends Event {
  target: IDBRequest & { error?: DOMException };
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        // Example indexes if needed later:
        // store.createIndex('clientLocation', 'clientInfo.clientLocation', { unique: false });
        // store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', (event as IDBErrorEvent).target?.error);
      reject((event as IDBErrorEvent).target?.error || new DOMException('IndexedDB open error'));
    };
  });
}

export async function saveInspectionToDB(inspectionData: FullInspectionData): Promise<string> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(inspectionData); // 'put' will add or update

    request.onsuccess = () => {
      resolve(request.result as string); // Returns the key of the stored item (inspectionData.id)
    };

    request.onerror = (event) => {
      console.error('Error saving inspection to DB:', (event as IDBErrorEvent).target?.error);
      reject((event as IDBErrorEvent).target?.error || new DOMException('Save to DB error'));
    };
  });
}

export async function loadInspectionFromDB(id: string): Promise<FullInspectionData | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result as FullInspectionData | undefined);
    };

    request.onerror = (event) => {
      console.error('Error loading inspection from DB:', (event as IDBErrorEvent).target?.error);
      reject((event as IDBErrorEvent).target?.error || new DOMException('Load from DB error'));
    };
  });
}

export async function getAllInspectionsFromDB(): Promise<FullInspectionData[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort by timestamp descending (newest first)
      const sortedResults = (request.result as FullInspectionData[]).sort((a, b) => b.timestamp - a.timestamp);
      resolve(sortedResults);
    };

    request.onerror = (event) => {
      console.error('Error getting all inspections from DB:', (event as IDBErrorEvent).target?.error);
      reject((event as IDBErrorEvent).target?.error || new DOMException('Get all from DB error'));
    };
  });
}

export async function deleteInspectionFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      console.error('Error deleting inspection from DB:', (event as IDBErrorEvent).target?.error);
      reject((event as IDBErrorEvent).target?.error || new DOMException('Delete from DB error'));
    };
  });
}

export async function clearAllInspectionsFromDB(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      console.error('Error clearing all inspections from DB:', (event as IDBErrorEvent).target?.error);
      reject((event as IDBErrorEvent).target?.error || new DOMException('Clear all from DB error'));
    };
  });
}
