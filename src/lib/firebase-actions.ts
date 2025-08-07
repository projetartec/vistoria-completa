
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
    await setDoc(docRef, inspectionData);
    // Also save to local IndexedDB for offline capabilities/caching
    await saveToLocalDB(inspectionData);
  } catch (error) {
    console.error("Error saving inspection to Firestore: ", error);
    throw new Error("Failed to save inspection to cloud.");
  }
}

// Get all inspections for the logged-in user from Firestore
export async function getInspectionsFromFirestore(owner: string): Promise<FullInspectionData[]> {
    try {
        const q = query(collection(db, INSPECTIONS_COLLECTION), where("owner", "==", owner));
        const querySnapshot = await getDocs(q);
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

// Load a single inspection from Firestore
export async function loadInspectionFromFirestore(id: string, owner: string): Promise<FullInspectionData | null> {
    try {
        const docRef = doc(db, INSPECTIONS_COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const inspectionData = docSnap.data() as FullInspectionData;
            // Basic security check
            if (inspectionData.owner === owner) {
                return inspectionData;
            } else {
                console.warn("User does not have permission to access this inspection.");
                return null;
            }
        } else {
            console.log("No such document in Firestore!");
            return null;
        }
    } catch (error) {
        console.error("Error loading inspection from Firestore: ", error);
        throw new Error("Failed to load inspection from cloud.");
    }
}


// Delete an inspection from Firestore and local IndexedDB
export async function deleteInspectionFromFirestore(id: string, owner: string): Promise<void> {
    try {
        // First, verify ownership before deleting
        const docRef = doc(db, INSPECTIONS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().owner === owner) {
            await deleteDoc(docRef);
            // Also delete from local DB
            await deleteFromLocalDB(id);
        } else {
           throw new Error("Permission denied or document does not exist.");
        }
    } catch (error) {
        console.error("Error deleting inspection from Firestore: ", error);
        throw new Error("Failed to delete inspection from cloud.");
    }
}
