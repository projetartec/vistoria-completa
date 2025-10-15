'use client';

// This file is intentionally being phased out for inspection data storage
// in favor of cloud-based storage with Firestore.
// We keep the basic structure for potential PWA caching but remove data-handling functions.

const DB_NAME = 'firecheckDB';
const DB_VERSION = 3; // Version remains, but the store might be cleared/deprecated.
const STORE_NAME = 'inspections';

// The openDB function can remain for other potential uses, but it's no longer
// used by the main inspection workflow.
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported.'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onerror = (event) => {
      console.error('IndexedDB error:', (event.target as IDBRequest)?.error);
      reject(new DOMException('IndexedDB open error'));
    };
  });
}

// All data-handling functions are removed to ensure data is managed by Firestore.
// export async function saveInspectionToDB(inspectionData: any): Promise<void> {}
// export async function getInspectionSummariesFromDB(): Promise<any[]> { return []; }
// export async function loadInspectionFromDB(id: string): Promise<any | null> { return null; }
// export async function deleteInspectionFromDB(id: string): Promise<void> {}

export {}; // To satisfy module requirements if all functions are removed.
