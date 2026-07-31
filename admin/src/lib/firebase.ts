// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDGxGnFqkl88wpJo-B-S5wQ4qVXDZ91rbE",
  authDomain: "evening-light-bcc3b.firebaseapp.com",
  projectId: "evening-light-bcc3b",
  storageBucket: "evening-light-bcc3b.firebasestorage.app",
  messagingSenderId: "563146815032",
  appId: "1:563146815032:web:d1475058ee9c0ec95c58cd",
  measurementId: "G-ZVWE7R4T60"
};

// Initialize Firebase
// Ensure that we only initialize once, especially in Next.js (SSR)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Only initialize analytics on the client side where supported
let analytics;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics };
