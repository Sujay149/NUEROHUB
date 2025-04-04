import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD3s4epC_l7yqDmYmV8pv0SsunaBUBz010",
  authDomain: "signup-1499.firebaseapp.com",
  projectId: "signup-1499",
  storageBucket: "signup-1499.appspot.com",
  messagingSenderId: "563207791243",
  appId: "1:563207791243:web:3d4fb6c5cb06a8c37bea8e",
  measurementId: "G-68ER9NYMBZ",
  databaseURL: "https://signup-1499-default-rtdb.firebaseio.com/",
};

// ✅ Prevent re-initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);

export default app;
