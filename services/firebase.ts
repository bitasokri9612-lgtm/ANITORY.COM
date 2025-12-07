import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore/lite";

const firebaseConfig = {
  apiKey: "AIzaSyDqROlY0YA9OPLEArsv6_5cmmr1Dld1hWs",
  authDomain: "anitory-281ad.firebaseapp.com",
  projectId: "anitory-281ad",
  storageBucket: "anitory-281ad.firebasestorage.app",
  messagingSenderId: "209968381874",
  appId: "1:209968381874:web:ab1b701473f763399c2eab",
  measurementId: "G-025CRDG0BJ"
};

// Initialize Firebase (Modular)
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);

export default app;