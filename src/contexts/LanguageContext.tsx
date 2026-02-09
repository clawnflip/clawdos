import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Language } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const detectBrowserLanguage = (): Language => {
  const browserLang = navigator.language.toLowerCase();
  
  // Check if browser language is Chinese
  if (browserLang.startsWith('zh')) {
    return 'zh';
  }
  
  // Default to English
  return 'en';
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get language from localStorage first
    const savedLang = localStorage.getItem('clawdos-language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'zh')) {
      return savedLang;
    }
    
    // Otherwise, detect from browser
    return detectBrowserLanguage();
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('clawdos-language', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
