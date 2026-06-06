import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
 apiKey: "AIzaSyBifTBcJweN55ed8u0XuivI2vJ4Zqmq6V0",
  authDomain: "medpos-webapp.firebaseapp.com",
  projectId: "medpos-webapp",
  storageBucket: "medpos-webapp.firebasestorage.app",
  messagingSenderId: "503616103388",
  appId: "1:503616103388:web:0a0a5fce188a6d9708e519"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);