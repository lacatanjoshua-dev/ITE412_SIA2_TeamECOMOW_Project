import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

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

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);

export default app;