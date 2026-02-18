import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Translations, getTranslations } from '@/lib/translations';
import { CONTENT_LANGUAGES, ContentLanguageCode } from '@/lib/languages';

interface LanguageContextType {
  language: ContentLanguageCode;
  setLanguage: (lang: ContentLanguageCode) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'campushub_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<ContentLanguageCode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as ContentLanguageCode) || 'en';
  });

  const setLanguage = (lang: ContentLanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, []);

  const t = useMemo(() => getTranslations(language), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
