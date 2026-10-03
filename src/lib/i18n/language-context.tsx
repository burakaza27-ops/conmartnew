"use client";

import React, { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import { translations, type Locale } from "./translations";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANG_STORAGE_KEY = "conmart_locale";
const LANG_COOKIE_NAME = "conmart_locale";

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): Locale {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem(LANG_STORAGE_KEY);
  return saved === "am" ? "am" : "en";
}

function getServerSnapshot(): Locale {
  return "en";
}

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function persistLocale(locale: Locale) {
  localStorage.setItem(LANG_STORAGE_KEY, locale);
  document.cookie = `${LANG_COOKIE_NAME}=${locale}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 365}`;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    persistLocale(newLocale);
    notify();
  };

  const toggleLocale = () => {
    setLocale(locale === "en" ? "am" : "en");
  };

  const t = (key: string, fallback?: string): string => {
    const currentDict = translations[locale];
    if (currentDict && currentDict[key]) {
      return currentDict[key];
    }
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    return fallback ?? key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
