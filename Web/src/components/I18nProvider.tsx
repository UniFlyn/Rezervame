"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";
import en from "../../../shared/locales/en.json";
import es from "../../../shared/locales/es.json";

type Language = "en" | "es";
type Translations = typeof en;

interface I18nContextType {
  language: Language;
  t: (key: keyof Translations) => string;
  setLanguage: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextType>({
  language: "es", // Default to Attached design language (Spanish)
  t: (key) => es[key],
  setLanguage: () => {},
});

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("es");
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
