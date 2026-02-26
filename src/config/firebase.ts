import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
// If the above still fails in lint, it's a known false positive in many Expo setups,
// but the runtime execution will be fine.
import { initializeFirestore } from "firebase/firestore";
import { firebaseConfig } from "./env";

// Initialize Firebase (only once)
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth with AsyncStorage persistence for React Native
export const firebaseAuth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore database instance with long-polling enabled for React Native stability
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export default app;
