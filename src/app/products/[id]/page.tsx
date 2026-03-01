'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import { getProductById } from '@/lib/mock-products';
import { useBotShield } from '@/hooks/use-bot-shield';
import { TurnstileWidget } from '@/components/bot-shield/TurnstileWidget';
import { BotModeToggle } from '@/components/bot-shield/BotModeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLocale } from '@/lib/locale-context';
import type { ActionType, RiskLevel } from '@/lib/bot-shield/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PurchaseResult {
  success: boolean;
  action: ActionType;
  risk_score: number;
  risk_level: RiskLevel;
  event_id: string;
  message: string;
  requireChallenge?: boolean;
}

// ---------------------------------------------------------------------------
// Result display config (locale-aware)
// ---------------------------------------------------------------------------

function getActionDisplay(t: (key: never, ...args: never[]) => string) {
  return {
    allow: {
      icon: '✓',
      title: t('result.allow.title' as never),
      subtitle: t('result.allow.subtitle' as never),
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-500/5',
      accent: 'text-emerald-400',
      barColor: 'bg-emerald-400',
    },
    flag: {
      icon: '⚠',
      title: t('result.flag.title' as never),
      subtitle: t('result.flag.subtitle' as never),
      border: 'border-amber-500/40',
      bg: 'bg-amber-500/5',
      accent: 'text-amber-400',
      barColor: 'bg-amber-400',
    },
    challenge: {
      icon: '🔐',
      title: t('result.challenge.title' as never),
      subtitle: t('result.challenge.subtitle' as never),
      border: 'border-orange-500/40',
      bg: 'bg-orange-500/5',
      accent: 'text-orange-400',
      barColor: 'bg-orange-400',
    },
    block: {
      icon: '✗',
      title: t('result.block.title' as never),
      subtitle: t('result.block.subtitle' as never),
      border: 'border-red-500/40',
      bg: 'bg-red-500/5',
      accent: 'text-red-400',
      barColor: 'bg-red-500',
    },
  } as const;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { locale, t } = useLocale();
  const product = getProductById(id, locale);
  const botShield = useBotShield();
  const { signals, reportSignals } = botShield;

  const [purchasing, setPurchasing] = useState(false);
  const [result, setResult] = useState<PurchaseResult | null>(null);
  const [showTurnstile, setShowTurnstile] = useState(false);

  const handlePurchase = useCallback(
    async (turnstileToken?: string) => {
      if (!product) return;
      setPurchasing(true);
      setResult(null);

      try {
        await reportSignals();

        const res = await fetch('/api/bot-shield/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            quantity: 1,
            signals,
            turnstileToken,
          }),
        });

        const data = (await res.json()) as PurchaseResult;
        setResult(data);

        if (data.requireChallenge) {
          setShowTurnstile(true);
        } else {
          setShowTurnstile(false);
        }
      } catch {
        setResult({
          success: false,
          action: 'block',
          risk_score: 0,
          risk_level: 'critical',
          event_id: '',
          message: t('product.networkError' as never),
        });
      } finally {
        setPurchasing(false);
      }
    },
    [product, signals, reportSignals, t],
  );

  const handleTurnstileSuccess = useCallback(
    (token: string) => {
      setShowTurnstile(false);
      handlePurchase(token);
    },
    [handlePurchase],
  );

  // ─── 404 ───
  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-grid-pattern">
        <div className="text-center">
          <p className="mb-4 text-6xl">🔍</p>
          <h1 className="mb-2 text-xl font-bold text-slate-200">
            {t('product.notFound' as never)}
          </h1>
          <Link
            href="/"
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {t('product.backToTop' as never)}
          </Link>
        </div>
      </div>
    );
  }

  const ACTION_DISPLAY = getActionDisplay(t);
  const display = result ? ACTION_DISPLAY[result.action] : null;
  const stockLabel = locale === 'ja' ? `残り ${product.stock} 点` : `${product.stock} left`;

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
              {t('nav.backToList' as never)}
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-slate-700/60 bg-slate-800/50 px-4 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:border-cyan-500/40 hover:text-cyan-400"
            >
              {t('nav.dashboard' as never)}
            </Link>
            <LanguageSwitcher />
          </div>
        </nav>
      </header>

      {/* ─── Product Detail ─── */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Image */}
          <div
            className="flex aspect-square items-center justify-center rounded-3xl"
            style={{
              background: `linear-gradient(135deg, ${product.gradientFrom}, ${product.gradientTo})`,
            }}
          >
            <span className="text-9xl opacity-80">{product.emoji}</span>
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-slate-500">
              {product.category}
            </p>
            <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-100">
              {product.name}
            </h1>
            <p className="mb-6 leading-relaxed text-slate-400">
              {product.description}
            </p>

            <div className="mb-8 flex items-baseline gap-4">
              <span className="text-4xl font-extrabold text-slate-100">
                &yen;{product.price.toLocaleString()}
              </span>
              <span className="text-sm text-slate-500">
                {t('product.taxIncluded' as never)}
              </span>
            </div>

            {/* Stock */}
            <div className="mb-8 flex items-center gap-3">
              <span className="text-sm text-slate-500">
                {t('product.stockLabel' as never)}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  product.stock <= 1
                    ? 'bg-red-500/15 text-red-400'
                    : product.stock <= 3
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-emerald-500/15 text-emerald-400'
                }`}
              >
                {stockLabel}
              </span>
            </div>

            {/* Purchase Button */}
            <button
              onClick={() => handlePurchase()}
              disabled={purchasing}
              className="group w-full rounded-2xl bg-cyan-500 py-4 text-base font-bold text-slate-950 transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {purchasing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="opacity-25"
                    />
                    <path
                      d="M12 2a10 10 0 0 1 10 10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="opacity-75"
                    />
                  </svg>
                  {t('product.purchasing' as never)}
                </span>
              ) : (
                t('product.purchase' as never)
              )}
            </button>

            {/* Info box */}
            <div className="mt-4 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4">
              <p className="text-xs leading-relaxed text-slate-500">
                {t('product.shieldInfo' as never)}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Turnstile Challenge ─── */}
        {showTurnstile && (
          <div className="mt-10 rounded-2xl border border-orange-500/30 bg-orange-500/5 p-8 text-center">
            <p className="mb-4 text-lg font-semibold text-orange-400">
              {t('challenge.title' as never)}
            </p>
            <p className="mb-6 text-sm text-slate-400">
              {t('challenge.description' as never)}
            </p>
            <div className="flex justify-center">
              <TurnstileWidget
                onSuccess={handleTurnstileSuccess}
                onError={() => setShowTurnstile(false)}
              />
            </div>
          </div>
        )}

        {/* ─── Purchase Result ─── */}
        {result && display && (
          <div
            className={`mt-10 rounded-2xl border ${display.border} ${display.bg} p-8`}
          >
            {/* Header */}
            <div className="mb-4 flex items-center gap-3">
              <span className={`text-3xl ${display.accent}`}>
                {display.icon}
              </span>
              <div>
                <h3 className={`text-xl font-bold ${display.accent}`}>
                  {display.title}
                </h3>
                <p className="text-sm text-slate-400">{display.subtitle}</p>
              </div>
            </div>

            {/* Score bar */}
            <div className="mt-6 rounded-xl border border-slate-700/30 bg-slate-900/50 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">
                  {t('result.riskScore' as never)}
                </span>
                <span className={`text-2xl font-bold font-mono ${display.accent}`}>
                  {result.risk_score}
                  <span className="text-sm text-slate-600"> / 100</span>
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full ${display.barColor} transition-all duration-700`}
                  style={{ width: `${result.risk_score}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>ALLOW &lt; 40</span>
                <span>FLAG &lt; 60</span>
                <span>CHALLENGE &lt; 80</span>
                <span>BLOCK</span>
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="rounded-lg bg-slate-800/40 px-2.5 py-1 font-mono">
                {t('result.event' as never)}: {result.event_id.slice(0, 8)}...
              </span>
              <span className="rounded-lg bg-slate-800/40 px-2.5 py-1 font-mono uppercase">
                {t('result.action' as never)}: {result.action}
              </span>
              <span className="rounded-lg bg-slate-800/40 px-2.5 py-1 font-mono uppercase">
                {t('result.level' as never)}: {result.risk_level}
              </span>
            </div>
          </div>
        )}
      </main>

      <BotModeToggle botShield={botShield} />
    </div>
  );
}
