'use client';

import Link from 'next/link';
import { BotDashboard } from '@/components/bot-shield/dashboard/BotDashboard';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLocale } from '@/lib/locale-context';

export default function DashboardPage() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-grid-pattern">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-xl">🛡️</span>
            <span className="text-base font-bold tracking-tight text-slate-100">
              BOT Shield
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-slate-400 transition-colors hover:text-cyan-400"
            >
              {t('nav.store' as never)}
            </Link>
            <span className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-400">
              {t('nav.dashboard' as never)}
            </span>
            <LanguageSwitcher />
          </div>
        </nav>
      </header>

      {/* ─── Dashboard Content ─── */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <BotDashboard />
      </main>
    </div>
  );
}
