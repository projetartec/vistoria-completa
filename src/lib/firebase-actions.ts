'use client';

import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, deleteDoc } from "firebase/firestore";
import type { FullInspectionData, InspectionSummary } from './types';

const INSPECTIONS_COLLECTION = 'inspections';

// Save inspection to Firestore ONLY.
export async function saveInspectionToFirestore(inspectionData: FullInspectionData): Promise<void> {
  try {
    const docRef = doc(db, INSPECTIONS_COLLECTION, inspectionData.id);
    const dataToSave = { ...inspectionData, owner: inspectionData.owner || 'system' };
    await setDoc(docRef, dataToSave);
  } catch (error) {
    console.error("Error saving inspection to Firestore: ", error);
    throw new Error("Failed to save inspection to cloud.");
  }
}

// Get summaries from Firestore ONLY.
export async function getInspectionSummariesFromFirestore(): Promise<InspectionSummary[]> {
    try {
        const inspectionsQuery = query(collection(db, INSPECTIONS_COLLECTION), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(inspectionsQuery);
        
        const summaries: InspectionSummary[] = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            // This robust check ensures that only valid documents are processed.
            if (data && data.clientInfo && typeof data.timestamp === 'number') {
                summaries.push({
                    id: docSnap.id,
                    clientInfo: {
                        clientLocation: data.clientInfo?.clientLocation || 'Local não especificado',
                        clientCode: data.clientInfo?.clientCode || '',
                        inspectionNumber: data.clientInfo?.inspectionNumber || docSnap.id,
                        inspectionDate: data.clientInfo?.inspectionDate || '',
                        inspectedBy: data.clientInfo?.inspectedBy || ''
                    },
                    timestamp: data.timestamp,
                    owner: data.owner || 'Desconhecido',
                });
            } else {
                console.warn(`Skipping invalid inspection document in Firestore with ID: ${docSnap.id}`);
            }
        });
        
        return summaries;

    } catch (error) {
        console.error("Error getting inspection summaries from Firestore: ", error);
        throw new Error("Failed to get inspection summaries from cloud.");
    }
}


// Load a single inspection from Firestore, accessible by any user
export async function loadInspectionFromFirestore(id: string): Promise<FullInspectionData | null> {
    try {
        const docRef = doc(db, INSPECTIONS_COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // No need to cast here, we can validate the data structure if needed
            const inspectionData = docSnap.data() as FullInspectionData;
            return inspectionData;
        } else {
            console.log("No such document in Firestore!");
            return null;
        }
    } catch (error)
        {
        console.error("Error loading inspection from Firestore: ", error);
        throw new Error("Failed to load inspection from cloud.");
    }
}


// Delete an inspection from Firestore ONLY.
export async function deleteInspectionFromFirestore(id: string): Promise<void> {
    try {
        const docRef = doc(db, INSPECTIONS_COLLECTION, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting inspection from Firestore: ", error);
        throw new Error("Failed to delete inspection from cloud.");
    }
}
