import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    User,
} from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { firebaseAuth } from "../config/firebase";
import { supabase } from "../config/supabase";
import type { Profile, UserRole } from "../types/database";

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
  logout: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Fetch user profile from Supabase
  const fetchProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      if (error) {
        console.warn("Profile fetch error:", error.message);
        setProfile(null);
        return;
      }
      setProfile(data as Profile | null);
    } catch (e) {
      console.error("Profile fetch exception:", e);
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

  // Firebase email/password registration + Supabase profile creation
  const register = async (
    email: string,
    password: string,
    name: string,
    role: UserRole = "volunteer",
    bloodGroup?: string,
  ): Promise<boolean> => {
    try {
      const credential = await createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        password,
      );
      if (credential.user) {
        // Update Firebase display name
        await updateProfile(credential.user, { displayName: name });

        // Create profile in Supabase
        const { error } = await supabase.from("profiles").insert({
          id: credential.user.uid,
          email: email.toLowerCase(),
          name,
          role,
          blood_group: bloodGroup || null,
          is_active: true,
        });

        if (error) {
          console.error("Profile creation error:", error.message);
          // Still return true — Firebase account was created
        }

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
