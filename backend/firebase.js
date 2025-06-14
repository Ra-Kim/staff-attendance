// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore"; 
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: "AIzaSyB_PnXrykKrgckzcuAMI_TQrJwEtFJFH_g",
  authDomain: "sharonstars.firebaseapp.com",
  projectId: "sharonstars",
  storageBucket: "sharonstars.firebasestorage.app",
  messagingSenderId: "386209057920",
  appId: "1:386209057920:web:a389f86b6f69eb21d7aa65",
  measurementId: "G-KQ3FS0FWTG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
})
// export const auth = getAuth(app);
export const db = getFirestore(app);
// export const analytics = getAnalytics(app);
export const storage = getStorage(app);