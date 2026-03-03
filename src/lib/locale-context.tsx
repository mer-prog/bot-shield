'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useSyncExternalStore,
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

// ---------------------------------------------------------------------------
// External store for locale (localStorage-backed)
// ---------------------------------------------------------------------------

let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'ja' || stored === 'en') return stored;
  const browserLang = navigator.language;
  return browserLang.startsWith('ja') ? 'ja' : 'en';
}

function getServerSnapshot(): Locale {
  return 'ja';
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
    emitChange();
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
