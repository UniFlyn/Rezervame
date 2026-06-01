"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { apiGet, apiPost, apiPostOptional } from "@/lib/api";
import { userFacingError } from "@/lib/userFacingError";

interface User {
  id?: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string | null;
  address?: string;
  gender?: string;
  age?: number | null;
}

export interface RegisterCustomerPayload {
  email: string;
  password: string;
  name: string;
  address?: string;
  phone?: string;
  gender?: string;
  age?: number;
}

interface AuthContextType {
  isLoggedIn: boolean;
  isHydrated: boolean;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (payload: RegisterCustomerPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<boolean>;
  /** One-shot action after successful login (e.g. continue adding a service on the venue page). */
  setPendingAfterLogin: (fn: (() => void) | null) => void;
  runPendingAfterLogin: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isHydrated: false,
  isLoginModalOpen: false,
  setIsLoginModalOpen: () => {},
  user: null,
  login: async () => {},
  loginWithGoogle: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => false,
  setPendingAfterLogin: () => {},
  runPendingAfterLogin: () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const pendingAfterLoginRef = useRef<(() => void) | null>(null);

  const setPendingAfterLogin = useCallback((fn: (() => void) | null) => {
    pendingAfterLoginRef.current = fn;
  }, []);

  const runPendingAfterLogin = useCallback((): boolean => {
    const fn = pendingAfterLoginRef.current;
    pendingAfterLoginRef.current = null;
    if (!fn) return false;
    fn();
    return true;
  }, []);

  const clearUserSession = useCallback(() => {
    pendingAfterLoginRef.current = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("rezervame_token");
    }
    setIsLoggedIn(false);
    setUser(null);
  }, []);

  const loadUserFromApi = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !localStorage.getItem("rezervame_token")) {
      setUser(null);
      setIsLoggedIn(false);
      setIsHydrated(true);
      return false;
    }
    try {
      const row = await apiGet<{
        id?: string;
        name: string;
        email: string;
        phone?: string;
        avatar?: string | null;
        address?: string;
        gender?: string;
        age?: number | null;
      }>("/auth/user-session", "USER");
      setUser({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone ?? "",
        avatar: row.avatar ?? null,
        address: row.address ?? "",
        gender: row.gender ?? "",
        age: row.age ?? null,
      });
      setIsLoggedIn(true);
      return true;
    } catch {
      clearUserSession();
      setIsHydrated(true);
      return false;
    } finally {
      setIsHydrated(true);
    }
  }, [clearUserSession]);

  useEffect(() => {
    void loadUserFromApi();
  }, [loadUserFromApi]);

  const login = async (email: string, password: string) => {
    try {
      const result = await apiPostOptional<{ token: string; user: { name: string; email: string; role: string } }>(
        "/auth/login",
        { email: email.trim().toLowerCase(), password },
      );
      if (!result || result.user.role !== "USER") {
        throw new Error("Invalid email or password.");
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("rezervame_token", result.token);
      }
      await loadUserFromApi();
    } catch (err) {
      throw new Error(userFacingError(err, "Invalid email or password."));
    }
  };

  const loginWithGoogle = async () => {
    const { signInWithGooglePopup } = await import("@/lib/firebase-auth");
    const idToken = await signInWithGooglePopup();
    const result = await apiPost<{ token: string; user: { name: string; email: string; role: string } }>(
      "/auth/google",
      { idToken },
    );
    if (result.user.role !== "USER") {
      throw new Error("This Google account cannot sign in as a customer");
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("rezervame_token", result.token);
    }
    await loadUserFromApi();
  };

  const register = async (payload: RegisterCustomerPayload) => {
    const result = await apiPost<{ token: string; user: { name: string; email: string; role: string } }>(
      "/auth/register",
      {
        ...payload,
        email: payload.email.trim().toLowerCase(),
      },
    );
    if (result.user.role !== "USER") {
      throw new Error("Registration failed");
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("rezervame_token", result.token);
    }
    await loadUserFromApi();
  };

  const logout = () => {
    clearUserSession();
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isHydrated,
        isLoginModalOpen,
        setIsLoginModalOpen,
        user,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshUser: loadUserFromApi,
        setPendingAfterLogin,
        runPendingAfterLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
