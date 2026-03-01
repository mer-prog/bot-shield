import { NextRequest, NextResponse } from 'next/server';
import type { DashboardStats, TimeSeriesDataPoint } from '@/lib/bot-shield/types';
import { getEventStats } from '@/lib/db/bot-events';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TopRiskIp {
  ip: string;
  eventCount: number;
  avgRiskScore: number;
}

interface StatsResponse {
  stats: DashboardStats;
  timeSeries: TimeSeriesDataPoint[];
  blockRate: number;
  topRiskIps: TopRiskIp[];
}

type TimeRange = '1h' | '24h' | '7d' | '30d';
const VALID_RANGES = new Set<string>(['1h', '24h', '7d', '30d']);

// ---------------------------------------------------------------------------
// Mock data — DB 未接続かつイベント 0 件のときに返す
// ---------------------------------------------------------------------------

function generateMockData(): StatsResponse {
  const now = new Date();

  const timeSeries: TimeSeriesDataPoint[] = Array.from(
    { length: 24 },
    (_, i) => {
      const ts = new Date(now);
      ts.setHours(now.getHours() - 23 + i, 0, 0, 0);
      const total = Math.floor(Math.random() * 40) + 10;
      const blocked = Math.floor(total * 0.15);
      const challenged = Math.floor(total * 0.1);
      const flagged = Math.floor(total * 0.2);
      return {
        timestamp: ts.toISOString(),
        total,
        blocked,
        challenged,
        flagged,
        allowed: total - blocked - challenged - flagged,
      };
    },
  );

  const totalEvents = timeSeries.reduce((s, d) => s + d.total, 0);
  const blockedCount = timeSeries.reduce((s, d) => s + d.blocked, 0);
  const challengedCount = timeSeries.reduce((s, d) => s + d.challenged, 0);
  const flaggedCount = timeSeries.reduce((s, d) => s + d.flagged, 0);
  const allowedCount = timeSeries.reduce((s, d) => s + d.allowed, 0);

  return {
    stats: {
      totalEvents,
      blockedCount,
      challengedCount,
      flaggedCount,
      allowedCount,
      averageRiskScore: 34,
      topSignals: [
        { signal: 'noMouseMovement', count: Math.floor(totalEvents * 0.25) },
        { signal: 'shortDwellTime', count: Math.floor(totalEvents * 0.2) },
        { signal: 'suspiciousUserAgent', count: Math.floor(totalEvents * 0.15) },
        { signal: 'abnormalKeyboard', count: Math.floor(totalEvents * 0.1) },
        { signal: 'botdAutomation', count: Math.floor(totalEvents * 0.08) },
      ],
    },
    timeSeries,
    blockRate: totalEvents > 0 ? blockedCount / totalEvents : 0,
    topRiskIps: [
      { ip: '203.0.113.42', eventCount: 28, avgRiskScore: 72 },
      { ip: '198.51.100.17', eventCount: 15, avgRiskScore: 65 },
      { ip: '192.0.2.88', eventCount: 9, avgRiskScore: 58 },
    ],
  };
}

// ---------------------------------------------------------------------------
// GET /api/bot-shield/stats
// ダッシュボード用統計
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rangeParam = searchParams.get('range') ?? '24h';
  const timeRange: TimeRange = VALID_RANGES.has(rangeParam)
    ? (rangeParam as TimeRange)
    : '24h';

  const { stats, timeSeries } = await getEventStats(timeRange);

  // DB 未接続かつイベント 0 件 → モックデータ
  if (stats.totalEvents === 0) {
    return NextResponse.json(generateMockData());
  }

  const blockRate =
    stats.totalEvents > 0 ? stats.blockedCount / stats.totalEvents : 0;

  const response: StatsResponse = {
    stats,
    timeSeries,
    blockRate,
    topRiskIps: [], // TODO: IP 別集計は getEventStats 拡張時に実装
  };

  return NextResponse.json(response);
}
