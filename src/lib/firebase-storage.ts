'use client';

import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { app } from './firebase';

const storage = getStorage(app);

/**
 * Uploads a data URI (e.g., from a file input or canvas) to Firebase Storage.
 * @param dataUri The data URI of the image to upload.
 * @param path The path in Firebase Storage where the image should be saved.
 * @returns A promise that resolves with the public download URL of the uploaded image.
 */
export async function uploadImageAndGetURL(dataUri: string, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    
    // Upload the data URI string. The 'data_url' format handles Base64 decoding.
    const snapshot = await uploadString(storageRef, dataUri, 'data_url');
    
    // Get the public URL of the uploaded file.
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image to Firebase Storage: ", error);
    // It's better to let the caller handle the error UI,
    // so we re-throw the error or a more specific one.
    throw new Error("Falha no upload da imagem. Verifique a conexão e as permissões do Firebase Storage.");
  }
}
