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
  apiKey: "AIzaSyDRO_02Yp7p7wiFbgVXt5__MoIzD4d8olg",
  authDomain: "mowerapp-2867a.firebaseapp.com",
  databaseURL:
    "https://mowerapp-2867a-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "mowerapp-2867a",
  storageBucket: "mowerapp-2867a.firebasestorage.app",
  messagingSenderId: "185618376949",
  appId: "1:185618376949:web:84d646def403c0f6c5fdbc",
  measurementId: "G-2E4WXPXHMN",
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