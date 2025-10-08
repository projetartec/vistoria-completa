
'use client';

// NOTE: This file is currently only used for Service Worker caching purposes.
// All inspection data is now handled via Firestore.

const DB_NAME = 'firecheckDB';
const DB_VERSION = 2; // Version incremented to ensure schema updates if any are needed in future.

interface IDBErrorEvent extends Event {
  target: IDBRequest & { error?: DOMException };
}

// This function is kept for potential future use or for other offline capabilities
// but is NOT used for storing the primary inspection data anymore.
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('inspections_legacy')) {
        // You can create stores here if needed for other purposes
        // For now, we can leave this empty or create a placeholder
         const store = db.createObjectStore('inspections_legacy', { keyPath: 'id' });
         store.createIndex('timestamp', 'timestamp', { unique: false });
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

    