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
  limit
} from 'firebase/firestore';
import { app } from './firebase';
import type { FullInspectionData, InspectionSummary } from './types';

const db = getFirestore(app);
const INSPECTIONS_COLLECTION = 'inspections';

// Function to save an entire inspection document
export async function saveInspectionToFirestore(inspectionData: FullInspectionData): Promise<void> {
  try {
    const inspectionRef = doc(db, INSPECTIONS_COLLECTION, inspectionData.id);
    await setDoc(inspectionRef, inspectionData, { merge: true });
  } catch (error) {
    console.error("Error saving inspection to Firestore: ", error);
    throw new Error("Não foi possível salvar a vistoria na nuvem.");
  }
}

// Function to get summaries of all inspections, ordered by timestamp
export async function getInspectionSummariesFromFirestore(ownerName?: string): Promise<InspectionSummary[]> {
  try {
    const inspectionsRef = collection(db, INSPECTIONS_COLLECTION);
    // Sort by timestamp in descending order to get the newest first
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
  } catch (error) {
    console.error("Error fetching inspection summaries from Firestore: ", error);
    throw new Error("Não foi possível buscar o histórico de vistorias da nuvem.");
  }
}

// Function to load a full inspection document
export async function loadInspectionFromFirestore(inspectionId: string): Promise<FullInspectionData | null> {
  try {
    const inspectionRef = doc(db, INSPECTIONS_COLLECTION, inspectionId);
    const docSnap = await getDoc(inspectionRef);
    if (docSnap.exists()) {
      return docSnap.data() as FullInspectionData;
    } else {
      console.warn(`No inspection found with ID: ${inspectionId}`);
      return null;
    }
  } catch (error) {
    console.error("Error loading inspection from Firestore: ", error);
    throw new Error("Não foi possível carregar a vistoria da nuvem.");
  }
}

// Function to delete an inspection document
export async function deleteInspectionFromFirestore(inspectionId: string): Promise<void> {
  try {
    const inspectionRef = doc(db, INSPECTIONS_COLLECTION, inspectionId);
    await deleteDoc(inspectionRef);
  } catch (error) {
    console.error("Error deleting inspection from Firestore: ", error);
    throw new Error("Não foi possível remover a vistoria da nuvem.");
  }
}