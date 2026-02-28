import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "firebase/app";
import {
  Auth,
  getAuth,
  initializeAuth,
} from "firebase/auth";
// @ts-ignore
import { getReactNativePersistence } from "firebase/auth";
// If the above still fails in lint, it's a known false positive in many Expo setups,
// but the runtime execution will be fine.
import { initializeFirestore } from "firebase/firestore";
import { firebaseConfig } from "./env";

// Initialize Firebase (only once)
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth with AsyncStorage persistence for React Native.
// Wrapped in try-catch to handle Expo hot-reload: initializeAuth throws
// "auth/already-initialized" if called twice on the same app instance.
let firebaseAuth: Auth;
try {
  firebaseAuth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e: any) {
  // On hot reload the Auth instance already exists — retrieve it instead
  if (e.code === "auth/already-initialized") {
    firebaseAuth = getAuth(app);
  } else {
    throw e;
  }
}
export { firebaseAuth };

// Firestore database instance with offline persistence enabled for React Native stability
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: {
    kind: "persistent",
  },
});

export default app;
