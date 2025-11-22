
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
  apiKey: "AIzaSyA64ZRAvLUdqIKXehia503faU_DL8y29vk",
  authDomain: "biology-generation.firebaseapp.com",
  projectId: "biology-generation",
  storageBucket: "biology-generation.firebasestorage.app",
  messagingSenderId: "595702168698",
  appId: "1:595702168698:web:723c47940e4318ba91cfc3",
  measurementId: "G-C09W1V3DZL"
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
