
'use client';

import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query } from "firebase/firestore";
import type { FullInspectionData } from './types';
import { saveInspectionToDB as saveToLocalDB, deleteInspectionFromDB as deleteFromLocalDB } from './indexedDB';

const INSPECTIONS_COLLECTION = 'inspections';

// Save inspection to Firestore and local IndexedDB
export async function saveInspectionToFirestore(inspectionData: FullInspectionData): Promise<void> {
  try {
    const docRef = doc(db, INSPECTIONS_COLLECTION, inspectionData.id);
    // Ensure owner is set, even if it's just a generic value or the current user's name
    const dataToSave = { ...inspectionData, owner: inspectionData.owner || 'system' };
    await setDoc(docRef, dataToSave);
    // Also save to local IndexedDB for offline capabilities/caching
    await saveToLocalDB(dataToSave);
  } catch (error) {
    console.error("Error saving inspection to Firestore: ", error);
    throw new Error("Failed to save inspection to cloud.");
  }
}

// Get all inspections for all users from Firestore
export async function getInspectionsFromFirestore(): Promise<FullInspectionData[]> {
    try {
        const inspectionsQuery = query(collection(db, INSPECTIONS_COLLECTION));
        const querySnapshot = await getDocs(inspectionsQuery);
        const inspections = querySnapshot.docs.map(doc => doc.data() as FullInspectionData);
        // Sort by timestamp descending (newest first)
        return inspections.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
        console.error("Error getting inspections from Firestore: ", error);
        throw new Error("Failed to get inspections from cloud.");
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
