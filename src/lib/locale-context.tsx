'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Locale, TranslationKey } from './i18n';
import { t as translate, getTranslation } from './i18n';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, ...args: never[]) => string;
  tf: (key: TranslationKey) => (...args: never[]) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = 'bot-shield-locale';

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'ja';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'ja' || stored === 'en') return stored;
  const browserLang = navigator.language;
  return browserLang.startsWith('ja') ? 'ja' : 'en';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: TranslationKey, ...args: never[]) => translate(locale, key, ...args),
    [locale],
  );

  const tf = useCallback(
    (key: TranslationKey) => {
      const val = getTranslation(locale, key);
      if (typeof val === 'function') return val as (...args: never[]) => string;
      return () => val as string;
    },
    [locale],
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, tf }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
