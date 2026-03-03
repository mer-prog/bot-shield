'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type {
  DashboardStats,
  TimeSeriesDataPoint,
} from '@/lib/bot-shield/types';
import { useLocale } from '@/lib/locale-context';

interface TooltipEntry {
  dataKey?: string | number;
  value?: number;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS = {
  allowed: '#06b6d4',
  flagged: '#f59e0b',
  challenged: '#f97316',
  blocked: '#ef4444',
} as const;

const AREA_GRADIENTS = [
  { id: 'gradAllowed', color: COLORS.allowed },
  { id: 'gradFlagged', color: COLORS.flagged },
  { id: 'gradChallenged', color: COLORS.challenged },
  { id: 'gradBlocked', color: COLORS.blocked },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(ts: string): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:00`;
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

function AreaTooltip({
  active,
  payload,
  label,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/95 p-3 text-xs backdrop-blur-sm">
      <p className="mb-2 font-mono text-slate-400">{formatTime(label ?? '')}</p>
      {payload.map((entry: TooltipEntry) => (
        <div
          key={entry.dataKey}
          className="flex items-center justify-between gap-6"
        >
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-300 capitalize">
              {String(entry.dataKey)}
            </span>
          </span>
          <span className="font-mono font-semibold text-slate-100">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RiskChartProps {
  timeSeries: TimeSeriesDataPoint[];
  stats: DashboardStats;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RiskChart({ timeSeries, stats }: RiskChartProps) {
  const { t } = useLocale();

  const pieData = [
    { name: t('chart.allowed'), value: stats.allowedCount, color: COLORS.allowed },
    { name: t('chart.flagged'), value: stats.flaggedCount, color: COLORS.flagged },
    {
      name: t('chart.challenged'),
      value: stats.challengedCount,
      color: COLORS.challenged,
    },
    { name: t('chart.blocked'), value: stats.blockedCount, color: COLORS.blocked },
  ].filter((d) => d.value > 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* ── Area Chart (時系列) ── */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-5 lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">
            {t('chart.threatTimeline')}
          </h3>
          <span className="text-[10px] font-mono text-slate-600 uppercase">
            {t('chart.hourly')}
          </span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={timeSeries}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <defs>
                {AREA_GRADIENTS.map((g) => (
                  <linearGradient
                    key={g.id}
                    id={g.id}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={g.color}
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor={g.color}
                      stopOpacity={0}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(51,65,85,0.4)"
                vertical={false}
              />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTime}
                tick={{ fill: '#64748b', fontSize: 11 }}
                stroke="rgba(51,65,85,0.4)"
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                stroke="rgba(51,65,85,0.4)"
                allowDecimals={false}
              />
              <Tooltip content={<AreaTooltip />} />
              <Area
                type="monotone"
                dataKey="allowed"
                stackId="1"
                stroke={COLORS.allowed}
                fill="url(#gradAllowed)"
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="flagged"
                stackId="1"
                stroke={COLORS.flagged}
                fill="url(#gradFlagged)"
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="challenged"
                stackId="1"
                stroke={COLORS.challenged}
                fill="url(#gradChallenged)"
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="blocked"
                stackId="1"
                stroke={COLORS.blocked}
                fill="url(#gradBlocked)"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Pie Chart (リスクレベル分布) ── */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">
            {t('chart.riskDistribution')}
          </h3>
        </div>
        <div className="relative h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(51,65,85,0.5)',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: '#f1f5f9',
                }}
                itemStyle={{ color: '#f1f5f9' }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span className="text-xs text-slate-400">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ paddingBottom: 50 }}>
            <div className="text-center">
              <p className="text-2xl font-extrabold font-mono text-slate-100">
                {stats.totalEvents.toLocaleString()}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                {t('chart.events')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
