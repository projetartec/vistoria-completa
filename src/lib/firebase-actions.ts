
'use client';

import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, orderBy, where, deleteDoc } from "firebase/firestore";
import type { FullInspectionData, InspectionSummary } from './types';
import { saveInspectionToDB as saveToLocalDB, deleteInspectionFromDB as deleteFromLocalDB } from './indexedDB';

const INSPECTIONS_COLLECTION = 'inspections';

// Save inspection to Firestore and local IndexedDB
export async function saveInspectionToFirestore(inspectionData: FullInspectionData): Promise<void> {
  try {
    const docRef = doc(db, INSPECTIONS_COLLECTION, inspectionData.id);
    const dataToSave = { ...inspectionData, owner: inspectionData.owner || 'system' };
    await setDoc(docRef, dataToSave);
    await saveToLocalDB(dataToSave);
  } catch (error) {
    console.error("Error saving inspection to Firestore: ", error);
    throw new Error("Failed to save inspection to cloud.");
  }
}

export async function getInspectionSummariesFromFirestore(): Promise<InspectionSummary[]> {
    try {
        const inspectionsQuery = query(collection(db, INSPECTIONS_COLLECTION), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(inspectionsQuery);
        
        const summaries = querySnapshot.docs.map(doc => {
            const data = doc.data() as FullInspectionData;
            return {
                id: doc.id,
                clientInfo: {
                    clientLocation: data.clientInfo?.clientLocation || 'Local não especificado',
                    clientCode: data.clientInfo?.clientCode || '',
                    inspectionNumber: data.clientInfo?.inspectionNumber || doc.id,
                    inspectionDate: data.clientInfo?.inspectionDate || '',
                    inspectedBy: data.clientInfo?.inspectedBy || ''
                },
                timestamp: data.timestamp,
                owner: data.owner || 'Desconhecido',
            };
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
            const inspectionData = docSnap.data() as FullInspectionData;
            return inspectionData;
        } else {
            console.log("No such document in Firestore!");
            return null;
        }
    } catch (error) {
        console.error("Error loading inspection from Firestore: ", error);
        throw new Error("Failed to load inspection from cloud.");
    }
}


// Delete an inspection from Firestore, able to be deleted by any authenticated user
export async function deleteInspectionFromFirestore(id: string): Promise<void> {
    try {
        const docRef = doc(db, INSPECTIONS_COLLECTION, id);
        await deleteDoc(docRef);
        // Also delete from local DB
        await deleteFromLocalDB(id);
    } catch (error) {
        console.error("Error deleting inspection from Firestore: ", error);
        throw new Error("Failed to delete inspection from cloud.");
    }
}

    