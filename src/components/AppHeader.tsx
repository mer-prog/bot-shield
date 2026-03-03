'use client';

import Link from 'next/link';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLocale } from '@/lib/locale-context';
import type { ReactNode } from 'react';

interface NavItem {
  href: string;
  labelKey: 'nav.products' | 'nav.store' | 'nav.dashboard' | 'nav.backToList';
  active?: boolean;
}

interface AppHeaderProps {
  navItems: NavItem[];
  maxWidth?: 'max-w-6xl' | 'max-w-7xl';
  children?: ReactNode;
}

export function AppHeader({ navItems, maxWidth = 'max-w-6xl' }: AppHeaderProps) {
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
      <nav className={`mx-auto flex h-16 ${maxWidth} items-center justify-between px-6`}>
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-xl" aria-hidden="true">🛡️</span>
          <span className="text-base font-bold tracking-tight text-slate-100">
            BOT Shield
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {navItems.map((item) =>
            item.active ? (
              <span
                key={item.href}
                className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-400"
              >
                {t(item.labelKey)}
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-400 transition-colors hover:text-cyan-400"
              >
                {t(item.labelKey)}
              </Link>
            ),
          )}
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}
