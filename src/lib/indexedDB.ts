
'use client';

import type { FullInspectionData, InspectionSummary } from './types';

const DB_NAME = 'firecheckDB';
const DB_VERSION = 3;
const STORE_NAME = 'inspections';

interface IDBErrorEvent extends Event {
  target: IDBRequest & { error?: DOMException };
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      } else {
        // If the store exists, check for the index
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        if (transaction) {
            const store = transaction.objectStore(STORE_NAME);
            if (!store.indexNames.contains('timestamp')) {
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        }
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', (event as IDBErrorEvent).target?.error);
      reject(new DOMException('IndexedDB open error'));
    };
  });
}

export async function saveInspectionToDB(inspectionData: FullInspectionData): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(inspectionData);

        request.onsuccess = () => resolve();
        request.onerror = (event) => {
            console.error('Error saving inspection to DB:', (event as IDBErrorEvent).target?.error);
            reject((event as IDBErrorEvent).target?.error);
        };
    });
}

export async function getInspectionSummariesFromDB(): Promise<InspectionSummary[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const request = index.getAll(); 

    request.onsuccess = () => {
      const allInspections = request.result as FullInspectionData[];
      const summaries: InspectionSummary[] = allInspections
        .map(full => ({
          id: full.id,
          clientInfo: full.clientInfo,
          timestamp: full.timestamp,
          owner: full.owner,
        }))
        .sort((a, b) => b.timestamp - a.timestamp); // Sort descending
      resolve(summaries);
    };

    request.onerror = (event) => {
      console.error('Error getting inspection summaries from DB:', (event as IDBErrorEvent).target?.error);
      reject((event as IDBErrorEvent).target?.error);
    };
  });
}

export async function loadInspectionFromDB(id: string): Promise<FullInspectionData | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result || null);
        };
        request.onerror = (event) => {
            console.error(`Error loading inspection ${id} from DB:`, (event as IDBErrorEvent).target?.error);
            reject((event as IDBErrorEvent).target?.error);
        };
    });
}

export async function deleteInspectionFromDB(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = (event) => {
            console.error(`Error deleting inspection ${id} from DB:`, (event as IDBErrorEvent).target?.error);
            reject((event as IDBErrorEvent).target?.error);
        };
    });
}
