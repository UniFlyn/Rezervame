"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import en from "../../../shared/locales/en.json";
import es from "../../../shared/locales/es.json";

type Language = "en" | "es";
type Translations = typeof en;

const STORAGE_KEY = "rezervame_panel_language";

interface I18nContextType {
  language: Language;
  t: (key: keyof Translations) => string;
  setLanguage: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextType>({
  language: "es",
  t: (key) => es[key] ?? String(key),
  setLanguage: () => {},
});

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("es");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "es") {
        setLanguageState(stored);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang === "en" ? "en" : "es";
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : "es";
  }, [language]);

  const translations = language === "en" ? en : es;

  const t = (key: keyof Translations) => {
    return translations[key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
