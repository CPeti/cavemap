// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBogABvIbGrHa7XY9D0Cc1Aqj-5AynqEXo",
  authDomain: "cavemap-3cb3d.firebaseapp.com",
  projectId: "cavemap-3cb3d",
  storageBucket: "cavemap-3cb3d.firebasestorage.app",
  messagingSenderId: "472053460337",
  appId: "1:472053460337:web:bcd0b6a5bb5e46eb04dad0",
  measurementId: "G-1X1EKM3ZKF"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
