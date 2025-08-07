
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  "projectId": "em-andamento-ys2c7",
  "appId": "1:704112085147:web:94ae1521b9d1c866ac9e3e",
  "storageBucket": "em-andamento-ys2c7.firebasestorage.app",
  "apiKey": "AIzaSyBjLgEJpSiC3ERVZqeMVdHXCpdVQWk1aN4",
  "authDomain": "em-andamento-ys2c7.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "704112085147"
};


// Initialize Firebase
let app: FirebaseApp;
let auth;
let db;

try {
  if (!firebaseConfig.apiKey) {
    throw new Error("Firebase API Key is missing. Please check your environment variables.");
  }
  
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);

} catch (error) {
  console.error("Firebase initialization error:", error);
  // We don't re-throw here. The app will handle the uninitialized state.
}


export { app, auth, db };
