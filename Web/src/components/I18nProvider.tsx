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
/** Set when the user explicitly picks a language in Profile → Configuración. */
const EXPLICIT_KEY = "rezervame_language_explicit";

const catalogs: Record<Language, Record<string, string>> = {
  en: en as Record<string, string>,
  es: es as Record<string, string>,
};

interface I18nContextType {
  language: Language;
  t: (key: keyof Translations | string) => string;
  setLanguage: (lang: Language) => void;
}

// Spanish-first (Panama market). English only after an explicit user choice.
function readStoredLanguage(): Language {
  if (typeof window === "undefined") return "es";
  if (localStorage.getItem(EXPLICIT_KEY) !== "1") return "es";
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
  const [language, setLanguageState] = useState<Language>("es");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(EXPLICIT_KEY) !== "1") {
      localStorage.removeItem(STORAGE_KEY);
      setLanguageState("es");
    } else {
      setLanguageState(readStoredLanguage());
    }
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
      localStorage.setItem(EXPLICIT_KEY, "1");
    }
  }, []);

  const t = useCallback(
    (key: keyof Translations | string) => {
      const catalog = catalogs[language];
      const hit = catalog[key];
      if (hit) return hit;
      if (language === "es") return String(key);
      return catalogs.en[key] ?? String(key);
    },
    [language],
  );

  const value = useMemo(() => ({ language, t, setLanguage }), [language, t, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
