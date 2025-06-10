import { getFirestore } from "firebase/firestore";
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyB_PnXrykKrgckzcuAMI_TQrJwEtFJFH_g",
  authDomain: "sharonstars.firebaseapp.com",
  projectId: "sharonstars",
  storageBucket: "sharonstars.firebasestorage.app",
  messagingSenderId: "386209057920",
  appId: "1:386209057920:web:a389f86b6f69eb21d7aa65",
  measurementId: "G-KQ3FS0FWTG",
};

// Initialize Firebase only if it hasn't been initialized yet
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase Authentication with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Cloud Firestore
export const db = getFirestore(app);

export default app;
