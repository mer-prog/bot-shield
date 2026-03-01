'use client';

import { useState } from 'react';
import { useBotShield } from '@/hooks/use-bot-shield';

const LEVEL_CONFIG = {
  low: { label: 'LOW', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  medium: { label: 'MEDIUM', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  high: { label: 'HIGH', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  critical: { label: 'CRITICAL', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
} as const;

const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 28; // r=28

export function BotScoreIndicator() {
  const { riskScore, riskLevel, isReady, simulateBotMode } = useBotShield();
  const [botMode, setBotMode] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const config = LEVEL_CONFIG[riskLevel];
  const dashOffset =
    GAUGE_CIRCUMFERENCE - (riskScore / 100) * GAUGE_CIRCUMFERENCE;

  const toggleBotMode = () => {
    const next = !botMode;
    setBotMode(next);
    simulateBotMode(next);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Collapsed: small circular button */}
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full border border-slate-700/60 backdrop-blur-xl cursor-pointer"
          style={{ background: config.bg }}
        >
          <svg width="56" height="56" viewBox="0 0 64 64" className="absolute">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="rgba(100,116,139,0.3)"
              strokeWidth="3"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke={config.color}
              strokeWidth="3"
              strokeDasharray={GAUGE_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 32 32)"
              className="animate-gauge"
            />
          </svg>
          <span
            className="text-xs font-bold font-mono"
            style={{ color: config.color }}
          >
            {riskScore}
          </span>
        </button>
      )}

      {/* Expanded panel */}
      {expanded && (
        <div
          className="w-64 rounded-2xl border border-slate-700/50 bg-slate-900/90 p-5 backdrop-blur-xl"
          style={{
            boxShadow: `0 0 30px ${config.bg}, 0 20px 50px rgba(0,0,0,0.5)`,
          }}
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-200">
                Bot Shield
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full animate-pulse-dot"
                  style={{ backgroundColor: isReady ? '#10b981' : '#94a3b8' }}
                />
                <span className="text-[10px] font-mono text-slate-500">
                  {isReady ? 'LIVE' : 'INIT'}
                </span>
              </span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none cursor-pointer"
            >
              &times;
            </button>
          </div>

          {/* Gauge */}
          <div className="mb-4 flex flex-col items-center">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <svg
                width="96"
                height="96"
                viewBox="0 0 64 64"
                className="absolute"
              >
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="rgba(100,116,139,0.2)"
                  strokeWidth="4"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke={config.color}
                  strokeWidth="4"
                  strokeDasharray={GAUGE_CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 32 32)"
                  className="animate-gauge"
                />
              </svg>
              <div className="flex flex-col items-center">
                <span
                  className="text-2xl font-bold font-mono"
                  style={{ color: config.color }}
                >
                  {riskScore}
                </span>
                <span className="text-[10px] text-slate-500">/ 100</span>
              </div>
            </div>
            <span
              className="mt-2 rounded-full px-3 py-0.5 text-[11px] font-bold tracking-widest"
              style={{
                color: config.color,
                backgroundColor: config.bg,
              }}
            >
              {config.label} RISK
            </span>
          </div>

          {/* Divider */}
          <div className="mb-3 h-px bg-slate-700/50" />

          {/* Bot Mode Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">BOT Mode (Demo)</span>
            <button
              onClick={toggleBotMode}
              className="relative h-5 w-9 rounded-full transition-colors cursor-pointer"
              style={{
                backgroundColor: botMode
                  ? 'rgba(239,68,68,0.4)'
                  : 'rgba(100,116,139,0.3)',
              }}
            >
              <span
                className="absolute top-0.5 h-4 w-4 rounded-full transition-transform"
                style={{
                  backgroundColor: botMode ? '#ef4444' : '#64748b',
                  transform: botMode ? 'translateX(17px)' : 'translateX(2px)',
                }}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
