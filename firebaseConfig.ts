
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Helper to safely access env vars if available, or return undefined
const getEnv = (key: string) => {
  try {
    return process.env[key];
  } catch (e) {
    return undefined;
  }
};

// Note: These keys are public in client-side code. Security rules in Firebase Console protect the data.
const firebaseConfig = {
  apiKey: "AIzaSyBmXj8niUi1QfbWg0g0Uvr_N4EkiepVaVE",
  authDomain: "biogen-ai.firebaseapp.com",
  projectId: "biogen-ai",
  storageBucket: "biogen-ai.firebasestorage.app",
  messagingSenderId: "661545702014",
  appId: "1:661545702014:web:985bb029a949a6640a3e2f",
  measurementId: "G-3W542HE1RT"
};

let app;
let auth: Auth | null = null;
let db: Firestore | null = null;
const googleProvider = new GoogleAuthProvider();

let isConfigured = false;

// Robust initialization to prevent app crash on invalid keys
try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isConfigured = true;
  } else {
    console.warn("Firebase credentials missing.");
  }
} catch (error) {
  console.error("Firebase initialization error (likely invalid API key):", error);
  isConfigured = false;
  auth = null;
  db = null;
}

export { auth, db, googleProvider, isConfigured };
