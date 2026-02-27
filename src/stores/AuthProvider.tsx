import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { db, firebaseAuth } from "../config/firebase";
import { usePushNotifications } from "../hooks/usePushNotifications";
import type { Profile, UserRole } from "../types/database";

// Cache key for persisting profile data locally
const profileCacheKey = (uid: string) => `@profile_cache_${uid}`;

export type { UserRole };

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: UserRole | null;
  userName: string;
  userEmail: string;
  userId: string | null;
  profile: Profile | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    password: string,
    name: string,
    role?: UserRole,
    bloodGroup?: string,
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  userRole: null,
  userName: "",
  userEmail: "",
  userId: null,
  profile: null,
  login: async () => false,
  register: async () => false,
  logout: async () => { },
  refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { expoPushToken } = usePushNotifications();

  // Sync push token to Firestore if it changes or is missing
  useEffect(() => {
    if (
      firebaseUser &&
      profile &&
      expoPushToken &&
      profile.expoPushToken !== expoPushToken
    ) {
      updateDoc(doc(db, "profiles", firebaseUser.uid), {
        expoPushToken,
      })
        .then(() => {
          setProfile((prev) => (prev ? { ...prev, expoPushToken } : null));
          console.log("Push token synced to profile successfully.");
        })
        .catch((e) => console.log("Failed to sync push token:", e));
    }
  }, [firebaseUser, profile, expoPushToken]);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await fetchProfile(user.uid);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  // Fetch user profile from Firestore with local cache fallback
  const fetchProfile = async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, "profiles", uid));
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Profile;
        // Persist to local cache
        AsyncStorage.setItem(profileCacheKey(uid), JSON.stringify(data)).catch(
          () => { },
        );
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (e: any) {
      console.warn("Profile fetch error — loading from cache:", e.message);
      try {
        const cached = await AsyncStorage.getItem(profileCacheKey(uid));
        if (cached) {
          setProfile(JSON.parse(cached) as Profile);
          return;
        }
      } catch (_) { }
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (firebaseUser) {
      await fetchProfile(firebaseUser.uid);
    }
  };

  // Firebase email/password sign-in
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password,
      );
      if (credential.user) {
        await fetchProfile(credential.user.uid);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Login error:", error.message);
      throw new Error(getFirebaseErrorMessage(error.code));
    }
  };

  // Firebase email/password registration + Firestore profile + volunteer creation
  const register = async (
    email: string,
    password: string,
    name: string,
    role: UserRole = "donor",
    bloodGroup?: string,
  ): Promise<boolean> => {
    console.log(`[Auth] register() called with email: ${email}, role: ${role}`);
    // Safety check: ensure role is donor for new registrations if not specified
    const finalRole = role === "volunteer" ? "donor" : role;

    try {
      const credential = await createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        password,
      );
      if (credential.user) {
        console.log(`[Auth] User created with UID: ${credential.user.uid}. Final Role: ${finalRole}`);
        // Update Firebase display name
        await updateProfile(credential.user, { displayName: name });

        const now = new Date().toISOString();

        // Create profile document in Firestore
        const profileData = {
          email: email.toLowerCase(),
          name,
          role: finalRole,
          blood_group: bloodGroup || null,
          is_active: true,
          points: 0,
          badges: ["new_recruit"],
          created_at: now,
          updated_at: now,
        };
        await setDoc(
          doc(db, "profiles", credential.user.uid),
          profileData,
        ).catch((e) => console.error("Profile creation error:", e.message));

        // Create a volunteer record using the SAME UID as the document ID
        // Note: New users start as 'inactive' volunteers until approved by admin
        const volunteerData: Record<string, any> = {
          profile_id: credential.user.uid,
          name,
          email: email.toLowerCase(),
          phone: "",
          blood_group: bloodGroup || "",
          area: "",
          city: "",
          status: "inactive",
          tasks_completed: 0,
          points: 0,
          badges: ["new_recruit"],
          joined_at: now,
          created_at: now,
          updated_at: now,
        };
        await setDoc(
          doc(db, "volunteers", credential.user.uid),
          volunteerData
        ).catch((e) =>
          console.error("Volunteer creation error:", e.message),
        );

        await fetchProfile(credential.user.uid);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Register error:", error.message);
      throw new Error(getFirebaseErrorMessage(error.code));
    }
  };

  const logout = async () => {
    try {
      // Clear cached profile on explicit logout
      if (firebaseUser) {
        await AsyncStorage.removeItem(profileCacheKey(firebaseUser.uid)).catch(
          () => { },
        );
      }
      await signOut(firebaseAuth);
      setProfile(null);
    } catch (error: any) {
      console.error("Logout error:", error.message);
    }
  };

  const isAuthenticated = !!firebaseUser && !!profile;
  const userRole = profile?.role ?? null;
  const userName = profile?.name ?? firebaseUser?.displayName ?? "";
  const userEmail = profile?.email ?? firebaseUser?.email ?? "";
  const userId = firebaseUser?.uid ?? null;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        userRole,
        userName,
        userEmail,
        userId,
        profile,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Human-readable Firebase auth error messages
function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Invalid email address";
    case "auth/user-disabled":
      return "This account has been disabled";
    case "auth/user-not-found":
      return "No account found with this email";
    case "auth/wrong-password":
      return "Incorrect password";
    case "auth/email-already-in-use":
      return "An account with this email already exists";
    case "auth/weak-password":
      return "Password should be at least 6 characters";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later";
    case "auth/network-request-failed":
      return "Network error. Please check your connection";
    default:
      return "Authentication failed. Please try again";
  }
}
