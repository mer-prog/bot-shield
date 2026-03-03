'use client';

import type { RiskLevel, ActionType } from '@/lib/bot-shield/types';
import type { EventSummary } from '@/app/api/bot-shield/stats/route';
import { useLocale } from '@/lib/locale-context';

// ---------------------------------------------------------------------------
// Level / Action badge styling
// ---------------------------------------------------------------------------

const LEVEL_STYLES: Record<RiskLevel, string> = {
  low: 'bg-cyan-500/15 text-cyan-400',
  medium: 'bg-amber-500/15 text-amber-400',
  high: 'bg-orange-500/15 text-orange-400',
  critical: 'bg-red-500/15 text-red-400',
};

const ACTION_STYLES: Record<ActionType, string> = {
  allow: 'bg-cyan-500/15 text-cyan-400',
  flag: 'bg-amber-500/15 text-amber-400',
  challenge: 'bg-orange-500/15 text-orange-400',
  block: 'bg-red-500/15 text-red-400',
};

const SCORE_COLORS: Array<{ max: number; color: string }> = [
  { max: 39, color: '#06b6d4' },
  { max: 59, color: '#f59e0b' },
  { max: 79, color: '#f97316' },
  { max: 100, color: '#ef4444' },
];

function getScoreColor(score: number): string {
  return SCORE_COLORS.find((c) => score <= c.max)?.color ?? '#ef4444';
}

function formatTimestamp(iso: string, locale: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(locale === 'ja' ? 'ja-JP' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function truncatePath(path: string, max: number = 28): string {
  if (path.length <= max) return path;
  return path.slice(0, max - 1) + '\u2026';
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EventsTableProps {
  events: EventSummary[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EventsTable({ events }: EventsTableProps) {
  const { locale, t, tf } = useLocale();
  const lastFn = tf('events.last');

  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">
          {t('events.title')}
        </h3>
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-600">
          {lastFn(events.length as never)}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800/60 text-slate-500">
              <th className="whitespace-nowrap pb-3 pr-4 font-medium">
                {t('events.time')}
              </th>
              <th className="whitespace-nowrap pb-3 pr-4 font-medium">
                {t('events.ip')}
              </th>
              <th className="whitespace-nowrap pb-3 pr-4 font-medium">
                {t('events.path')}
              </th>
              <th className="whitespace-nowrap pb-3 pr-4 font-medium text-right">
                {t('events.score')}
              </th>
              <th className="whitespace-nowrap pb-3 pr-4 font-medium">
                {t('events.level')}
              </th>
              <th className="whitespace-nowrap pb-3 font-medium">
                {t('events.action')}
              </th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr
                key={event.id}
                className="border-b border-slate-800/30 transition-colors hover:bg-slate-800/20"
              >
                <td className="whitespace-nowrap py-3 pr-4 font-mono text-slate-400">
                  {formatTimestamp(event.createdAt, locale)}
                </td>
                <td className="whitespace-nowrap py-3 pr-4 font-mono text-slate-300">
                  {event.ipAddress}
                </td>
                <td
                  className="whitespace-nowrap py-3 pr-4 font-mono text-slate-500"
                  title={event.path}
                >
                  {truncatePath(event.path)}
                </td>
                <td className="whitespace-nowrap py-3 pr-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${event.riskScore}%`,
                          backgroundColor: getScoreColor(event.riskScore),
                        }}
                      />
                    </div>
                    <span
                      className="w-6 text-right font-mono font-semibold"
                      style={{ color: getScoreColor(event.riskScore) }}
                    >
                      {event.riskScore}
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap py-3 pr-4">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${LEVEL_STYLES[event.riskLevel]}`}
                  >
                    {event.riskLevel}
                  </span>
                </td>
                <td className="whitespace-nowrap py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ACTION_STYLES[event.action]}`}
                  >
                    {event.action}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {events.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-600">
            {t('dashboard.noEvents')}
          </div>
        )}
      </div>
    </div>
  );
}
