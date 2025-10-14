
'use client';

import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function dataUriToBlob(dataURI: string): Blob {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

export async function uploadImageAndGetURL(fileOrDataUri: File | string): Promise<string> {
  if (!storage) {
    throw new Error("Firebase Storage is not initialized.");
  }
  
  const blob = typeof fileOrDataUri === 'string' ? dataUriToBlob(fileOrDataUri) : fileOrDataUri;
  const fileExtension = blob.type.split('/')[1] || 'jpg';
  const uniqueFileName = `inspections/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
  const storageRef = ref(storage, uniqueFileName);

  try {
    const snapshot = await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image to Firebase Storage:", error);
    throw new Error("Failed to upload image.");
  }
}
