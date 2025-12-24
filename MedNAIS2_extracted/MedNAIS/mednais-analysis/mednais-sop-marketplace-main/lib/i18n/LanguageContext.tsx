"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, defaultLocale } from './locales';
import { translations } from './translations';

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (section: string, key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const stored = localStorage.getItem('locale') as Locale;
    if (stored && Object.keys(translations).includes(stored)) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    document.documentElement.lang = newLocale;
  };

  const t = (section: string, key: string): string => {
    const localeTranslations = translations[locale as keyof typeof translations];
    if (!localeTranslations) return key;
    
    const sectionTranslations = localeTranslations[section as keyof typeof localeTranslations];
    if (!sectionTranslations) return key;
    
    const translation = sectionTranslations[key as keyof typeof sectionTranslations];
    return translation || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
