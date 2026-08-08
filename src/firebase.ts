import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// =====================================================
// FIREBASE CONFIG
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyD6Yn1fQ2HFzLRzO0d4m38o1_upy-E",
  authDomain: "mowerapp-3be07.firebaseapp.com",
  databaseURL:
    "https://mowerapp-3be07-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mowerapp-3be07",
  storageBucket: "mowerapp-3be07.firebasestorage.app",
  messagingSenderId: "544654094117",
  appId: "1:544654094117:web:cd1cf5fcaa248d0d1cb4cc",
  measurementId: "G-TBDW2GL4HN",
};

// =====================================================
// INITIALIZE FIREBASE
// =====================================================

const app = initializeApp(firebaseConfig);

// =====================================================
// FIREBASE AUTHENTICATION
// =====================================================

export const auth = getAuth(app);

// Google Sign-In Provider
export const googleProvider = new GoogleAuthProvider();

// =====================================================
// FIRESTORE
// =====================================================

export const db = getFirestore(app);

// =====================================================
// REALTIME DATABASE
// =====================================================

export const realtimeDb = getDatabase(app);

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default app;