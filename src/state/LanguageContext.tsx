import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { defaultLanguageCode, getLanguage, SupportedLanguageCode, translate } from '../i18n/language';

const storageKey = 'index-card.language.v1';

type LanguageContextValue = {
  languageCode: SupportedLanguageCode;
  languageLabel: string;
  setLanguageCode: (languageCode: SupportedLanguageCode) => void;
  t: (key: Parameters<typeof translate>[1]) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function isSupportedLanguageCode(value: string): value is SupportedLanguageCode {
  return ['de-DE', 'en-US', 'tr-TR', 'sr-RS', 'hr-HR', 'es-ES', 'it-IT'].includes(value);
}

export function LanguageProvider({ children }: PropsWithChildren) {
  const [languageCode, setLanguageCodeState] = useState<SupportedLanguageCode>(defaultLanguageCode);

  useEffect(() => {
    let isMounted = true;

    async function loadLanguage() {
      const saved = await AsyncStorage.getItem(storageKey);
      if (isMounted && saved && isSupportedLanguageCode(saved)) {
        setLanguageCodeState(saved);
      }

    }

    loadLanguage().catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const language = getLanguage(languageCode);

    return {
      languageCode,
      languageLabel: language.label,
      setLanguageCode: (nextLanguageCode) => {
        setLanguageCodeState(nextLanguageCode);
        AsyncStorage.setItem(storageKey, nextLanguageCode).catch(() => undefined);
      },
      t: (key) => translate(languageCode, key),
    };
  }, [languageCode]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }

  return context;
}
