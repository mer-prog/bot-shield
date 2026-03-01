'use client';

import type { DashboardStats } from '@/lib/bot-shield/types';

interface StatsCardsProps {
  stats: DashboardStats;
  blockRate: number;
}

interface CardDef {
  label: string;
  value: string;
  icon: string;
  color: string;
  bg: string;
}

function scoreColor(score: number): { color: string; bg: string } {
  if (score <= 39) return { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' };
  if (score <= 59) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
  if (score <= 79) return { color: '#f97316', bg: 'rgba(249,115,22,0.1)' };
  return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
}

export function StatsCards({ stats, blockRate }: StatsCardsProps) {
  const avgColor = scoreColor(stats.averageRiskScore);

  const cards: CardDef[] = [
    {
      label: 'Total Events (24h)',
      value: stats.totalEvents.toLocaleString(),
      icon: '📊',
      color: '#06b6d4',
      bg: 'rgba(6,182,212,0.08)',
    },
    {
      label: 'Blocked',
      value: stats.blockedCount.toLocaleString(),
      icon: '🚫',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.08)',
    },
    {
      label: 'Block Rate',
      value: `${(blockRate * 100).toFixed(1)}%`,
      icon: '🛡️',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.08)',
    },
    {
      label: 'Avg Risk Score',
      value: String(stats.averageRiskScore),
      icon: '⚡',
      color: avgColor.color,
      bg: avgColor.bg,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-5 backdrop-blur-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              {card.label}
            </span>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm"
              style={{ backgroundColor: card.bg }}
            >
              {card.icon}
            </span>
          </div>
          <p
            className="text-3xl font-extrabold font-mono tracking-tight"
            style={{ color: card.color }}
          >
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
