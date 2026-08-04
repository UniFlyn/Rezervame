"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { apiGet, apiPost, apiPostOptional } from "@/lib/api";
import { userFacingError } from "@/lib/userFacingError";
import {
  clearSessionExpiry,
  fetchSecurityPolicy,
  isSessionExpired,
  passwordLengthMessage,
  passwordTooShort,
  storeSessionExpiry,
} from "@/lib/securityPolicy";

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
  hasStoredSession: boolean;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isFavoritePromptOpen: boolean;
  openFavoritePrompt: (afterLogin?: () => void) => void;
  closeFavoritePrompt: () => void;
  openLoginFromFavoritePrompt: () => void;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (payload: RegisterCustomerPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<boolean>;
  whenHydrated: () => Promise<void>;
  /** One-shot action after successful login (e.g. continue adding a service on the venue page). */
  setPendingAfterLogin: (fn: (() => void) | null) => void;
  runPendingAfterLogin: () => boolean;
}

function readStoredUserToken(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("rezervame_token"));
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isHydrated: false,
  hasStoredSession: false,
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
  isFavoritePromptOpen: false,
  openFavoritePrompt: () => {},
  closeFavoritePrompt: () => {},
  openLoginFromFavoritePrompt: () => {},
  whenHydrated: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Always false on first render so static export HTML matches client hydration.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [hasStoredSession, setHasStoredSession] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isFavoritePromptOpen, setIsFavoritePromptOpen] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const pendingAfterLoginRef = useRef<(() => void) | null>(null);
  const favoritePendingRef = useRef<(() => void) | null>(null);
  const hydratedResolversRef = useRef<Array<() => void>>([]);

  const resolveHydrationWaiters = useCallback(() => {
    const waiters = hydratedResolversRef.current;
    hydratedResolversRef.current = [];
    waiters.forEach((fn) => fn());
  }, []);

  const whenHydrated = useCallback((): Promise<void> => {
    if (isHydrated) return Promise.resolve();
    return new Promise<void>((resolve) => {
      hydratedResolversRef.current.push(resolve);
      window.setTimeout(resolve, 8000);
    });
  }, [isHydrated]);

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

  const openFavoritePrompt = useCallback((afterLogin?: () => void) => {
    favoritePendingRef.current = afterLogin ?? null;
    setIsFavoritePromptOpen(true);
  }, []);

  const closeFavoritePrompt = useCallback(() => {
    favoritePendingRef.current = null;
    setIsFavoritePromptOpen(false);
  }, []);

  const openLoginFromFavoritePrompt = useCallback(() => {
    const pending = favoritePendingRef.current;
    favoritePendingRef.current = null;
    setIsFavoritePromptOpen(false);
    if (pending) pendingAfterLoginRef.current = pending;
    setIsLoginModalOpen(true);
  }, []);

  const clearUserSession = useCallback(() => {
    pendingAfterLoginRef.current = null;
    favoritePendingRef.current = null;
    setIsFavoritePromptOpen(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("rezervame_token");
      clearSessionExpiry("USER");
    }
    setHasStoredSession(false);
    setIsLoggedIn(false);
    setUser(null);
  }, []);

  const loadUserFromApi = useCallback(async (): Promise<boolean> => {
    const tokenPresent = readStoredUserToken();
    setHasStoredSession(tokenPresent);

    if (typeof window === "undefined" || !tokenPresent) {
      setUser(null);
      setIsLoggedIn(false);
      setIsHydrated(true);
      resolveHydrationWaiters();
      return false;
    }
    if (isSessionExpired("USER")) {
      clearUserSession();
      setIsHydrated(true);
      resolveHydrationWaiters();
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
      setHasStoredSession(true);
      return true;
    } catch {
      clearUserSession();
      return false;
    } finally {
      setIsHydrated(true);
      resolveHydrationWaiters();
    }
  }, [clearUserSession, resolveHydrationWaiters]);

  useEffect(() => {
    void loadUserFromApi();
  }, [loadUserFromApi]);

  useEffect(() => {
    if (typeof window === "undefined" || !isLoggedIn) return;
    const id = window.setInterval(() => {
      if (isSessionExpired("USER")) clearUserSession();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [isLoggedIn, clearUserSession]);

  const login = async (email: string, password: string) => {
    try {
      const policy = await fetchSecurityPolicy();
      if (passwordTooShort(password, policy.minPasswordLength)) {
        throw new Error(passwordLengthMessage(policy.minPasswordLength));
      }
      const result = await apiPostOptional<{
        token: string;
        user: { name: string; email: string; role: string };
        sessionExpiresAt?: string;
      }>("/auth/login", { email: email.trim().toLowerCase(), password });
      if (!result || result.user.role !== "USER") {
        throw new Error("Invalid email or password.");
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("rezervame_token", result.token);
        storeSessionExpiry("USER", result.sessionExpiresAt);
      }
      setHasStoredSession(true);
      setUser({
        name: result.user.name,
        email: result.user.email,
        phone: "",
        avatar: null,
      });
      setIsLoggedIn(true);
      setIsHydrated(true);
      await loadUserFromApi();
    } catch (err) {
      throw new Error(userFacingError(err, "Invalid email or password."));
    }
  };

  const loginWithGoogle = async () => {
    const { signInWithGooglePopup } = await import("@/lib/firebase-auth");
    const idToken = await signInWithGooglePopup();
    const result = await apiPost<{
      token: string;
      user: { name: string; email: string; role: string };
      sessionExpiresAt?: string;
    }>("/auth/google", { idToken });
    if (result.user.role !== "USER") {
      throw new Error("This Google account cannot sign in as a customer");
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("rezervame_token", result.token);
      storeSessionExpiry("USER", result.sessionExpiresAt);
    }
    setHasStoredSession(true);
    setUser({
      name: result.user.name,
      email: result.user.email,
      phone: "",
      avatar: null,
    });
    setIsLoggedIn(true);
    setIsHydrated(true);
    await loadUserFromApi();
  };

  const register = async (payload: RegisterCustomerPayload) => {
    const policy = await fetchSecurityPolicy();
    if (passwordTooShort(payload.password, policy.minPasswordLength)) {
      throw new Error(passwordLengthMessage(policy.minPasswordLength));
    }
    const result = await apiPost<{
      token: string;
      user: { name: string; email: string; role: string };
      sessionExpiresAt?: string;
    }>("/auth/register", {
      ...payload,
      email: payload.email.trim().toLowerCase(),
    });
    if (result.user.role !== "USER") {
      throw new Error("Registration failed");
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("rezervame_token", result.token);
      storeSessionExpiry("USER", result.sessionExpiresAt);
    }
    setHasStoredSession(true);
    setUser({
      name: result.user.name,
      email: result.user.email,
      phone: "",
      avatar: null,
    });
    setIsLoggedIn(true);
    setIsHydrated(true);
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
        hasStoredSession,
        isLoginModalOpen,
        setIsLoginModalOpen,
        user,
        login,
        loginWithGoogle,
        register,
        logout,
        refreshUser: loadUserFromApi,
        whenHydrated,
        setPendingAfterLogin,
        runPendingAfterLogin,
        isFavoritePromptOpen,
        openFavoritePrompt,
        closeFavoritePrompt,
        openLoginFromFavoritePrompt,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
