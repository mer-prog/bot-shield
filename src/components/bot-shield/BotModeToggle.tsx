'use client';

import { useState } from 'react';
import type { BotSignals, RiskLevel } from '@/lib/bot-shield/types';
import { BOT_SHIELD_CONFIG } from '@/lib/bot-shield/config';
import { useBotShield, type UseBotShieldReturn } from '@/hooks/use-bot-shield';
import { useLocale } from '@/lib/locale-context';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GAUGE_R = 28;
const GAUGE_C = 2 * Math.PI * GAUGE_R;
const MAX_CONTRIBUTION = 50; // botdAutomation — max contribution

const LEVEL_CONFIG = {
  low: { label: 'LOW', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  medium: { label: 'MEDIUM', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  high: { label: 'HIGH', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  critical: {
    label: 'CRITICAL',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
  },
} as const;

const ACTION_CONFIG: Record<
  RiskLevel,
  { label: string; icon: string; color: string; bg: string }
> = {
  low: {
    label: 'ALLOW',
    icon: '✓',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.15)',
  },
  medium: {
    label: 'FLAG',
    icon: '⚠',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.15)',
  },
  high: {
    label: 'CHALLENGE',
    icon: '🔐',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.15)',
  },
  critical: {
    label: 'BLOCK',
    icon: '🚫',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.15)',
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BotModeToggleProps {
  botShield?: UseBotShieldReturn;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BotModeToggle({ botShield }: BotModeToggleProps) {
  const internal = useBotShield();
  const { signals, riskScore, riskLevel, isReady, simulateBotMode } =
    botShield ?? internal;

  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [botMode, setBotMode] = useState(false);

  const level = LEVEL_CONFIG[riskLevel];
  const action = ACTION_CONFIG[riskLevel];
  const dashOffset = GAUGE_C - (riskScore / 100) * GAUGE_C;

  // Signal breakdown — sorted by max possible contribution
  const { weights } = BOT_SHIELD_CONFIG.scoring;

  const signalLabelKeys: Record<keyof BotSignals, string> = {
    botdAutomation: 'signal.botdAutomation',
    turnstileFailed: 'signal.turnstileFailed',
    rateLimitExceeded: 'signal.rateLimitExceeded',
    noMouseMovement: 'signal.noMouseMovement',
    rapidPurchases: 'signal.rapidPurchases',
    shortDwellTime: 'signal.shortDwellTime',
    abnormalKeyboard: 'signal.abnormalKeyboard',
    suspiciousUserAgent: 'signal.suspiciousUserAgent',
  };

  const breakdown = (Object.keys(weights) as (keyof BotSignals)[])
    .map((key) => {
      const w = weights[key];
      const contrib = Math.round(w.baseScore * w.multiplier);
      return {
        key,
        label: t(signalLabelKeys[key] as never),
        contribution: signals[key] ? contrib : 0,
        maxContribution: contrib,
        active: signals[key],
      };
    })
    .sort((a, b) => b.maxContribution - a.maxContribution);

  const toggleBotMode = () => {
    const next = !botMode;
    setBotMode(next);
    simulateBotMode(next);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* ── Collapsed pill ── */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2.5 rounded-full border border-slate-700/60 bg-slate-900/90 px-4 py-2.5 backdrop-blur-xl transition-all hover:border-slate-600 cursor-pointer"
          style={{
            boxShadow: `0 0 24px ${level.bg}`,
          }}
        >
          <span className="text-base">🤖</span>
          <span
            className="text-sm font-bold font-mono"
            style={{ color: level.color }}
          >
            {riskScore}
          </span>
          <span
            className="inline-block h-2 w-2 rounded-full animate-pulse-dot"
            style={{ backgroundColor: level.color }}
          />
        </button>
      )}

      {/* ── Expanded panel ── */}
      {expanded && (
        <div
          className="w-72 rounded-2xl border border-slate-700/50 bg-slate-900/95 backdrop-blur-xl"
          style={{
            boxShadow: botMode
              ? '0 0 40px rgba(239,68,68,0.15), 0 20px 50px rgba(0,0,0,0.5)'
              : `0 0 30px ${level.bg}, 0 20px 50px rgba(0,0,0,0.5)`,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/60 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🤖</span>
              <span className="text-sm font-semibold text-slate-200">
                {t('toggle.botMode' as never)}
              </span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300 cursor-pointer"
            >
              &times;
            </button>
          </div>

          <div className="p-5">
            {/* Toggle */}
            <div className="mb-5 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {botMode
                  ? t('toggle.botActive' as never)
                  : t('toggle.normalMode' as never)}
              </span>
              <button
                onClick={toggleBotMode}
                className="relative h-6 w-11 rounded-full transition-colors cursor-pointer"
                style={{
                  backgroundColor: botMode
                    ? 'rgba(239,68,68,0.4)'
                    : 'rgba(100,116,139,0.3)',
                }}
              >
                <span
                  className="absolute left-0 top-0.5 h-5 w-5 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: botMode ? '#ef4444' : '#64748b',
                    transform: botMode
                      ? 'translateX(22px)'
                      : 'translateX(2px)',
                  }}
                />
              </button>
            </div>

            {/* Gauge */}
            <div className="mb-4 flex flex-col items-center">
              <div className="relative flex h-28 w-28 items-center justify-center">
                <svg
                  width="112"
                  height="112"
                  viewBox="0 0 64 64"
                  className="absolute"
                >
                  <circle
                    cx="32"
                    cy="32"
                    r={GAUGE_R}
                    fill="none"
                    stroke="rgba(100,116,139,0.15)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r={GAUGE_R}
                    fill="none"
                    stroke={level.color}
                    strokeWidth="4"
                    strokeDasharray={GAUGE_C}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 32 32)"
                    className="animate-gauge"
                  />
                </svg>
                <div className="flex flex-col items-center">
                  <span
                    className="text-3xl font-extrabold font-mono"
                    style={{ color: level.color }}
                  >
                    {riskScore}
                  </span>
                  <span className="text-[10px] text-slate-600">/ 100</span>
                </div>
              </div>

              {/* Risk level badge */}
              <span
                className="mt-1 rounded-full px-3 py-0.5 text-[10px] font-bold tracking-widest"
                style={{ color: level.color, backgroundColor: level.bg }}
              >
                {level.label} RISK
              </span>

              {/* Live dot */}
              <span className="mt-2 flex items-center gap-1">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full animate-pulse-dot"
                  style={{
                    backgroundColor: isReady ? '#10b981' : '#94a3b8',
                  }}
                />
                <span className="text-[9px] font-mono text-slate-600 uppercase">
                  {isReady
                    ? t('toggle.monitoring' as never)
                    : t('toggle.initializing' as never)}
                </span>
              </span>
            </div>

            {/* Action banner */}
            <div
              className="mb-5 rounded-xl py-2.5 text-center transition-colors duration-300"
              style={{ backgroundColor: action.bg }}
            >
              <span
                className="text-sm font-bold tracking-wider"
                style={{ color: action.color }}
              >
                {action.icon} {action.label}
              </span>
            </div>

            {/* Divider */}
            <div className="mb-3 flex items-center gap-2">
              <div className="h-px flex-1 bg-slate-800/60" />
              <span className="text-[9px] font-mono uppercase tracking-wider text-slate-600">
                {t('toggle.signalAnalysis' as never)}
              </span>
              <div className="h-px flex-1 bg-slate-800/60" />
            </div>

            {/* Signal breakdown bars */}
            <div className="space-y-2">
              {breakdown.map((s) => (
                <div key={s.key} className="flex items-center gap-2">
                  <span
                    className={`w-16 truncate text-[10px] ${
                      s.active
                        ? 'text-slate-300 font-medium'
                        : 'text-slate-600'
                    }`}
                  >
                    {s.label}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800/60">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(s.contribution / MAX_CONTRIBUTION) * 100}%`,
                        backgroundColor: s.active
                          ? level.color
                          : 'transparent',
                      }}
                    />
                  </div>
                  <span
                    className={`w-7 text-right font-mono text-[10px] ${
                      s.active ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    {s.active ? `+${s.contribution}` : '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
