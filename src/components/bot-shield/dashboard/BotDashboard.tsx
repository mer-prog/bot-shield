'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { DashboardStats, TimeSeriesDataPoint } from '@/lib/bot-shield/types';
import type { EventSummary } from '@/app/api/bot-shield/stats/route';
import { useLocale } from '@/lib/locale-context';
import { StatsCards } from './StatsCards';
import { RiskChart } from './RiskChart';
import { EventsTable } from './EventsTable';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TimeRange = '1h' | '24h' | '7d' | '30d';

interface StatsData {
  stats: DashboardStats;
  timeSeries: TimeSeriesDataPoint[];
  blockRate: number;
  recentEvents: EventSummary[];
}

const RANGES: { value: TimeRange; label: string }[] = [
  { value: '1h', label: '1H' },
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
];

const REFRESH_INTERVAL_MS = 30_000;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BotDashboard() {
  const { locale, t } = useLocale();
  const [data, setData] = useState<StatsData | null>(null);
  const [range, setRange] = useState<TimeRange>('24h');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (r: TimeRange) => {
    try {
      const res = await fetch(`/api/bot-shield/stats?range=${r}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as StatsData;
      setData(json);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[BotDashboard] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + auto-refresh
  useEffect(() => {
    setLoading(true);
    fetchData(range);

    intervalRef.current = setInterval(() => fetchData(range), REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [range, fetchData]);

  const handleRangeChange = (r: TimeRange) => {
    setRange(r);
  };

  // ─── Loading skeleton ───
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-slate-800/60 bg-slate-900/50"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl border border-slate-800/60 bg-slate-900/50 lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-2xl border border-slate-800/60 bg-slate-900/50" />
        </div>
        <div className="h-64 animate-pulse rounded-2xl border border-slate-800/60 bg-slate-900/50" />
      </div>
    );
  }

  if (!data) return null;

  const timeLocale = locale === 'ja' ? 'ja-JP' : 'en-US';

  return (
    <div className="space-y-6">
      {/* ── Dashboard sub-header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-100">
            {t('dashboard.title' as never)}
          </h2>
          <span className="flex items-center gap-1.5 rounded-full border border-slate-700/50 bg-slate-800/50 px-2.5 py-0.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              Live
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Last updated */}
          {lastUpdated && (
            <span className="text-[10px] font-mono text-slate-600">
              Updated{' '}
              {lastUpdated.toLocaleTimeString(timeLocale, {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })}
            </span>
          )}

          {/* Time range selector */}
          <div className="flex rounded-lg border border-slate-700/50 bg-slate-800/40 p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => handleRangeChange(r.value)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  range === r.value
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <StatsCards stats={data.stats} blockRate={data.blockRate} />

      {/* ── Charts ── */}
      <RiskChart timeSeries={data.timeSeries} stats={data.stats} />

      {/* ── Events Table ── */}
      <EventsTable events={data.recentEvents} />
    </div>
  );
}
