import { initializeApp, getApps, getApp } from "firebase/app";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQ6PU8AaM0hhGkdGMtU0x2StpOy8OLOKQ",
  authDomain: "rezerveme-1fce5.firebaseapp.com",
  projectId: "rezerveme-1fce5",
  storageBucket: "rezerveme-1fce5.firebasestorage.app",
  messagingSenderId: "679012793687",
  appId: "1:679012793687:web:3c830985e8318cd2b5d212"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export { app };
