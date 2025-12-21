// firebase-config.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// TODO: REPLACE THE FOLLOWING WITH YOUR FIREBASE CONFIG
// 1. Go to Firebase Console -> Project Settings
// 2. Copy the "firebaseConfig" object
// 3. Paste it here

// Check if running in Vite environment
if (typeof import.meta.env === 'undefined' || !import.meta.env.VITE_FIREBASE_API_KEY) {
    alert("⚠️ Setup Error: You must run 'npm run dev' to start the website.\n\nDo not open index.html directly.");
    console.error("Missing Environment Variables. Ensure .env file exists and you are running via Vite.");
}

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

console.log("Firebase Configured with Project:", firebaseConfig.projectId);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, signInWithEmailAndPassword, onAuthStateChanged, signOut };
