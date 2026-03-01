'use client';

import { useLocale } from '@/lib/locale-context';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <button
      onClick={() => setLocale(locale === 'ja' ? 'en' : 'ja')}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800/50 text-xs font-bold text-slate-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-400 cursor-pointer"
      title={locale === 'ja' ? 'Switch to English' : '日本語に切替'}
    >
      {locale === 'ja' ? 'EN' : 'JA'}
    </button>
  );
}
