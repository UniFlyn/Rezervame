"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import en from "../../../shared/locales/en.json";

type Language = "en";
type Translations = typeof en;

interface I18nContextType {
  language: Language;
  t: (key: keyof Translations) => string;
  /** @deprecated English-only; no-op */
  setLanguage: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextType>({
  language: "en",
  t: (key) => en[key] ?? String(key),
  setLanguage: () => {},
});

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const language = "en";

  useEffect(() => {
    document.documentElement.lang = "en";
  }, []);

  const setLanguage = (lang: Language) => {
    // No-op to preserve existing calling signatures
  };

  const t = (key: keyof Translations) => {
    return en[key] || String(key);
  };

  return (
    <I18nContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
