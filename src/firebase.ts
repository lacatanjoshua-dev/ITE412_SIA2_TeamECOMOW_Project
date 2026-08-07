
// src/firebase.ts

import { initializeApp } from "firebase/app";

import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth";

import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDOxTnAybxscR_pC1mOeYJzlGrATJFRm_0",

  authDomain: "mowerapp-58361.firebaseapp.com",

  databaseURL:
    "https://mowerapp-58361-default-rtdb.firebaseio.com",

  projectId: "mowerapp-58361",

  storageBucket:
    "mowerapp-58361.firebasestorage.app",

  messagingSenderId: "444459064838",

  appId:
    "1:444459064838:web:a4447201f4bc3baa256d87",
};

const app = initializeApp(firebaseConfig);

// ===============================
// FIREBASE SERVICES
// ===============================

export const auth = getAuth(app);

export const db = getFirestore(app);

export const storage = getStorage(app);

export const realtimeDb = getDatabase(app);

// ===============================
// AUTH PROVIDERS
// ===============================

export const googleProvider =
  new GoogleAuthProvider();

export const facebookProvider =
  new FacebookAuthProvider();

