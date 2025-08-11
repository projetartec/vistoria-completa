
'use client';

import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where } from "firebase/firestore";
import type { FullInspectionData } from './types';
import { saveInspectionToDB as saveToLocalDB, deleteInspectionFromDB as deleteFromLocalDB } from './indexedDB';

const INSPECTIONS_COLLECTION = 'inspections';

// Save inspection to Firestore and local IndexedDB
export async function saveInspectionToFirestore(inspectionData: FullInspectionData): Promise<void> {
  try {
    const docRef = doc(db, INSPECTIONS_COLLECTION, inspectionData.id);
    // The owner property is set on the object before calling this function.
    // No need for a specific check here anymore if all users can see all inspections.
    await setDoc(docRef, inspectionData);
    // Also save to local IndexedDB for offline capabilities/caching
    await saveToLocalDB(inspectionData);
  } catch (error) {
    console.error("Error saving inspection to Firestore: ", error);
    throw new Error("Failed to save inspection to cloud.");
  }
}

// Get all inspections for all users from Firestore
export async function getInspectionsFromFirestore(): Promise<FullInspectionData[]> {
    try {
        const querySnapshot = await getDocs(collection(db, INSPECTIONS_COLLECTION));
        const inspections: FullInspectionData[] = [];
        querySnapshot.forEach((doc) => {
            inspections.push(doc.data() as FullInspectionData);
        });
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
        // We're removing the ownership check to allow any user to delete.
        // A check if the document exists is implicitly handled by Firestore permissions if needed,
        // but for app logic, we proceed directly to delete.
        await deleteDoc(docRef);
        // Also delete from local DB
        await deleteFromLocalDB(id);
    } catch (error) {
        console.error("Error deleting inspection from Firestore: ", error);
        throw new Error("Failed to delete inspection from cloud.");
    }
}
