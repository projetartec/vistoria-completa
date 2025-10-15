
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
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
let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
