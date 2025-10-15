'use client';

import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { app } from './firebase';
import type { FullInspectionData, InspectionSummary } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const db = getFirestore(app);
const INSPECTIONS_COLLECTION = 'inspections';

// Function to save an entire inspection document
export async function saveInspectionToFirestore(inspectionData: FullInspectionData): Promise<void> {
  const inspectionRef = doc(db, INSPECTIONS_COLLECTION, inspectionData.id);
  setDoc(inspectionRef, inspectionData, { merge: true }).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
        path: inspectionRef.path,
        operation: 'create', // or 'update' depending on merge behavior
        requestResourceData: inspectionData,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

// Function to get summaries of all inspections, ordered by timestamp
export async function getInspectionSummariesFromFirestore(ownerName?: string): Promise<InspectionSummary[]> {
  try {
    const inspectionsRef = collection(db, INSPECTIONS_COLLECTION);
    const q = ownerName
      ? query(inspectionsRef, where("owner", "==", ownerName), orderBy('timestamp', 'desc'))
      : query(inspectionsRef, orderBy('timestamp', 'desc'));

    const querySnapshot = await getDocs(q);
    const summaries: InspectionSummary[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as FullInspectionData;
      summaries.push({
        id: data.id,
        clientInfo: data.clientInfo,
        timestamp: data.timestamp,
        owner: data.owner,
      });
    });
    return summaries;
  } catch (error: any) {
    if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: `/${INSPECTIONS_COLLECTION}`,
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
    console.error("Error fetching inspection summaries from Firestore: ", error);
    throw new Error("Não foi possível buscar o histórico de vistorias da nuvem.");
  }
}

// Function to load a full inspection document
export async function loadInspectionFromFirestore(inspectionId: string): Promise<FullInspectionData | null> {
    const inspectionRef = doc(db, INSPECTIONS_COLLECTION, inspectionId);
    try {
        const docSnap = await getDoc(inspectionRef);
        if (docSnap.exists()) {
            return docSnap.data() as FullInspectionData;
        } else {
            console.warn(`No inspection found with ID: ${inspectionId}`);
            return null;
        }
    } catch (error: any) {
         if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: inspectionRef.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        console.error("Error loading inspection from Firestore: ", error);
        throw new Error("Não foi possível carregar a vistoria da nuvem.");
    }
}

// Function to delete an inspection document
export async function deleteInspectionFromFirestore(inspectionId: string): Promise<void> {
  const inspectionRef = doc(db, INSPECTIONS_COLLECTION, inspectionId);
  deleteDoc(inspectionRef).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
        path: inspectionRef.path,
        operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}
