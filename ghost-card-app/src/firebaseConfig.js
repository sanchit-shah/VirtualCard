// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC8UaVJ3ihHk_3UHStJ3dpEu7x9ZW3dgm0",
  authDomain: "ghostcard-6d6ed.firebaseapp.com",
  projectId: "ghostcard-6d6ed",
  storageBucket: "ghostcard-6d6ed.firebasestorage.app",
  messagingSenderId: "572095251879",
  appId: "1:572095251879:web:d96ca99129633176842282",
  measurementId: "G-6KHTDJ01V3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);