'use client';

import Link from 'next/link';
import { getLocalizedProducts } from '@/lib/mock-products';
import { BotModeToggle } from '@/components/bot-shield/BotModeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLocale } from '@/lib/locale-context';

function StockBadge({ stock, locale }: { stock: number; locale: 'ja' | 'en' }) {
  const color =
    stock <= 1
      ? 'bg-red-500/20 text-red-400'
      : stock <= 3
        ? 'bg-amber-500/20 text-amber-400'
        : 'bg-emerald-500/20 text-emerald-400';

  const label = locale === 'ja' ? `残り ${stock} 点` : `${stock} left`;

  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${color}`}>
      {label}
    </span>
  );
}

export default function Home() {
  const { locale, t } = useLocale();
  const products = getLocalizedProducts(locale);

  return (
    <div className="min-h-screen bg-grid-pattern">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
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
              {t('nav.products')}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-700/60 bg-slate-800/50 px-4 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-400"
            >
              {t('nav.dashboard')}
            </Link>
            <LanguageSwitcher />
          </div>
        </nav>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-cyan-500/5 blur-3xl" />

        <div className="mx-auto max-w-6xl px-6 pb-16 pt-24 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-800/50 px-4 py-1.5 text-sm text-slate-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
            {t('hero.badge')}
          </div>

          <h1 className="mb-4 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-gradient-hero">BOT Shield</span>
            <br />
            <span className="text-slate-100">Demo Store</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-400 whitespace-pre-line">
            {t('hero.description')}
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400"
            >
              {t('hero.ctaDashboard')}
            </Link>
            <a
              href="#products"
              className="rounded-xl border border-slate-700/60 px-6 py-3 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100"
            >
              {t('hero.ctaProducts')}
            </a>
          </div>
        </div>
      </section>

      {/* ─── Products Grid ─── */}
      <section id="products" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">
              {t('products.title')}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t('products.subtitle')}
            </p>
          </div>
          <span className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-1 text-xs font-mono text-slate-500">
            {products.length} items
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="card-hover group rounded-2xl border border-slate-800/60 bg-slate-900/50 overflow-hidden"
            >
              <div
                className="relative flex h-48 items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${product.gradientFrom}, ${product.gradientTo})`,
                }}
              >
                <span className="text-6xl opacity-80 transition-transform group-hover:scale-110">
                  {product.emoji}
                </span>
                <div className="absolute right-3 top-3">
                  <StockBadge stock={product.stock} locale={locale} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-900/80 to-transparent" />
              </div>

              <div className="p-5">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  {product.category}
                </p>
                <h3 className="mb-3 text-sm font-semibold leading-snug text-slate-200 group-hover:text-cyan-400 transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-100">
                    &yen;{product.price.toLocaleString()}
                  </span>
                  <span className="rounded-lg bg-slate-800/60 px-3 py-1 text-xs font-medium text-cyan-400 opacity-0 transition-opacity group-hover:opacity-100">
                    {t('products.viewDetail')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <BotModeToggle />
    </div>
  );
}
