"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isLoginModalOpen: false,
  setIsLoginModalOpen: () => {},
  user: null,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedAuth = localStorage.getItem("rezervame_auth");
    if (savedAuth === "true") {
      setIsLoggedIn(true);
      setUser({
        name: "Richard Lucas",
        email: "richardlucas01@gmail.com",
        phone: "(786) 717-1203",
        avatar: "/richard_lucas_avatar.png",
      });
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoggedIn(true);
    setUser({
      name: "Richard Lucas",
      email: email,
      phone: "(786) 717-1203",
      avatar: "/richard_lucas_avatar.png",
    });
    localStorage.setItem("rezervame_auth", "true");
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem("rezervame_auth");
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoginModalOpen, setIsLoginModalOpen, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
