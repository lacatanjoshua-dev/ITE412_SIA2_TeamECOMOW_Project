import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

import {
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";

import {
  getFirestore,
} from "firebase/firestore";

import {
  getDatabase,
} from "firebase/database";

import {
  getStorage,
} from "firebase/storage";

// =====================================================
// FIREBASE CONFIGURATION
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyD6Yn1fQ2HFzLRGeVRzO0d4m38o1_upy-E",
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
// FIREBASE SERVICES
// =====================================================

// Firebase Authentication
export const auth = getAuth(app);

// Google Authentication Provider
export const googleProvider =
  new GoogleAuthProvider();

// Firestore
export const db = getFirestore(app);

// Realtime Database
export const realtimeDb =
  getDatabase(app);

// Firebase Storage
export const storage =
  getStorage(app);

// =====================================================
// ANALYTICS
// =====================================================

// Analytics is optional.
// This prevents errors in environments where
// Analytics is not supported.
isSupported()
  .then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  })
  .catch(() => {
    // Analytics unavailable
  });

// Export Firebase app if needed elsewhere
export default app;