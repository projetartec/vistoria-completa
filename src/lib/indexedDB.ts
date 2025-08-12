
'use client';

import type { FullInspectionData, InspectionSummary } from './types';

const DB_NAME = 'firecheckDB';
const STORE_NAME = 'inspections';
const DB_VERSION = 2; // Version incremented to ensure schema updates if any are needed in future.

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


export async function saveInspectionToDB(inspectionData: FullInspectionData): Promise<string> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(inspectionData); 

    request.onsuccess = () => {
      resolve(request.result as string);
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

export async function deleteInspectionFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = (event) => {
      reject((event as IDBErrorEvent).target?.error);
    };
  });
}

export async function getInspectionSummariesFromDB(): Promise<InspectionSummary[]> {
  const db = await openDB();
  return new Promise<InspectionSummary[]>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const request = index.getAll(); 

    request.onsuccess = () => {
      const allData: FullInspectionData[] = request.result.sort((a, b) => b.timestamp - a.timestamp);
      const summaries: InspectionSummary[] = allData.map(data => ({
        id: data.id,
        clientInfo: {
            clientLocation: data.clientInfo?.clientLocation || 'Local não especificado',
            clientCode: data.clientInfo?.clientCode || '',
            inspectionNumber: data.clientInfo?.inspectionNumber || data.id,
            inspectionDate: data.clientInfo?.inspectionDate || '',
            inspectedBy: data.clientInfo?.inspectedBy || ''
        },
        timestamp: data.timestamp,
        owner: data.owner || 'Desconhecido',
      }));
      resolve(summaries);
    };
    request.onerror = (event) => {
      reject((event as IDBErrorEvent).target?.error);
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
