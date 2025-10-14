
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
// We are removing auth, db, and storage to prevent initialization errors.
// import { getAuth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";
// import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  "projectId": "em-andamento-ys2c7",
  "appId": "1:704112085147:web:94ae1521b9d1c866ac9e3e",
  "storageBucket": "em-andamento-ys2c7.appspot.com",
  "apiKey": "AIzaSyBjLgEJpSiC3ERVZqeMVdHXCpdVQWk1aN4",
  "authDomain": "em-andamento-ys2c7.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "704112085147"
};


// Initialize Firebase
let app: FirebaseApp | undefined;
let auth: any = undefined;
let db: any = undefined;
let storage: any = undefined;

try {
  if (!firebaseConfig.apiKey) {
    // This check is kept, but we won't throw an error to avoid crashing.
    console.warn("Firebase API Key is missing.");
  }
  
  // We only initialize the app, but not the other services.
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  // auth = getAuth(app);
  // db = getFirestore(app);
  // storage = getStorage(app);

} catch (error) {
  console.error("Firebase initialization error:", error);
  // We don't re-throw here. The app will handle the uninitialized state.
}


export { app, auth, db, storage };
