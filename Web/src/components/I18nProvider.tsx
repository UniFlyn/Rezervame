"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import en from "../../../shared/locales/en.json";
import es from "../../../shared/locales/es.json";

export type Language = "en" | "es";
type Translations = typeof en;

const STORAGE_KEY = "rezervame_language";

const catalogs: Record<Language, Record<string, string>> = {
  en: en as Record<string, string>,
  es: es as Record<string, string>,
};

interface I18nContextType {
  language: Language;
  t: (key: keyof Translations | string) => string;
  setLanguage: (lang: Language) => void;
}

// Spanish-first (Panama market), matching the Rezervame design prototype.
// A stored preference always wins, so users who pick English keep English.
function readStoredLanguage(): Language {
  if (typeof window === "undefined") return "es";
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === "en" ? "en" : "es";
}

const I18nContext = createContext<I18nContextType>({
  language: "es",
  t: (key) =>
    (es as Record<string, string>)[key as string] ??
    (en as Record<string, string>)[key as string] ??
    String(key),
  setLanguage: () => {},
});

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => readStoredLanguage());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLanguageState(readStoredLanguage());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = language === "es" ? "es" : "en";
  }, [language, ready]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, lang);
    }
  }, []);

  const t = useCallback(
    (key: keyof Translations | string) => {
      const catalog = catalogs[language];
      const enCatalog = catalogs.en;
      return catalog[key] ?? enCatalog[key] ?? String(key);
    },
    [language],
  );

  const value = useMemo(() => ({ language, t, setLanguage }), [language, t, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
