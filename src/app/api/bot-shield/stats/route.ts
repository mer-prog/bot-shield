import { NextRequest, NextResponse } from 'next/server';
import type {
  DashboardStats,
  TimeSeriesDataPoint,
  RiskLevel,
  ActionType,
} from '@/lib/bot-shield/types';
import { getEventStats, getRecentEvents } from '@/lib/db/bot-events';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TopRiskIp {
  ip: string;
  eventCount: number;
  avgRiskScore: number;
}

export interface EventSummary {
  id: string;
  ipAddress: string;
  path: string;
  riskScore: number;
  riskLevel: RiskLevel;
  action: ActionType;
  createdAt: string;
}

interface StatsResponse {
  stats: DashboardStats;
  timeSeries: TimeSeriesDataPoint[];
  blockRate: number;
  topRiskIps: TopRiskIp[];
  recentEvents: EventSummary[];
}

type TimeRange = '1h' | '24h' | '7d' | '30d';
const VALID_RANGES = new Set<string>(['1h', '24h', '7d', '30d']);

// ---------------------------------------------------------------------------
// Mock data — DB 未接続かつイベント 0 件のときに返す
// ---------------------------------------------------------------------------

const MOCK_IPS = [
  '203.0.113.42',
  '198.51.100.17',
  '192.0.2.88',
  '10.0.0.55',
  '172.16.0.201',
  '203.0.113.99',
  '198.51.100.33',
  '192.0.2.12',
];

const MOCK_PATHS = [
  '/products/nike-air-max-95-neon',
  '/products/ps5-pro',
  '/products/metal-build-strike-freedom',
  '/products/supreme-box-logo-hoodie',
  '/products/pokemon-card-151-box',
  '/api/bot-shield/purchase',
];

function scoreToLevel(score: number): RiskLevel {
  if (score <= 39) return 'low';
  if (score <= 59) return 'medium';
  if (score <= 79) return 'high';
  return 'critical';
}

function levelToAction(level: RiskLevel): ActionType {
  switch (level) {
    case 'low':
      return 'allow';
    case 'medium':
      return 'flag';
    case 'high':
      return 'challenge';
    case 'critical':
      return 'block';
  }
}

function generateMockEvents(): EventSummary[] {
  const now = Date.now();
  return Array.from({ length: 20 }, () => {
    const score =
      Math.random() < 0.55
        ? Math.floor(Math.random() * 40)
        : Math.floor(Math.random() * 61) + 40;
    const level = scoreToLevel(score);
    return {
      id: crypto.randomUUID(),
      ipAddress: MOCK_IPS[Math.floor(Math.random() * MOCK_IPS.length)],
      path: MOCK_PATHS[Math.floor(Math.random() * MOCK_PATHS.length)],
      riskScore: score,
      riskLevel: level,
      action: levelToAction(level),
      createdAt: new Date(
        now - Math.floor(Math.random() * 86_400_000),
      ).toISOString(),
    };
  }).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

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
        {
          signal: 'suspiciousUserAgent',
          count: Math.floor(totalEvents * 0.15),
        },
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
    recentEvents: generateMockEvents(),
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

  const events = await getRecentEvents(100);
  const recentEvents: EventSummary[] = events.slice(0, 20).map((e) => ({
    id: e.id,
    ipAddress: e.ipAddress,
    path: e.path,
    riskScore: e.riskScore,
    riskLevel: e.riskLevel,
    action: e.action,
    createdAt: e.createdAt.toISOString(),
  }));

  // Compute top risk IPs from recent events
  const ipAgg = new Map<string, { totalScore: number; count: number }>();
  for (const e of events) {
    const entry = ipAgg.get(e.ipAddress) ?? { totalScore: 0, count: 0 };
    entry.totalScore += e.riskScore;
    entry.count += 1;
    ipAgg.set(e.ipAddress, entry);
  }
  const topRiskIps: TopRiskIp[] = Array.from(ipAgg.entries())
    .map(([ip, { totalScore, count }]) => ({
      ip,
      eventCount: count,
      avgRiskScore: Math.round(totalScore / count),
    }))
    .sort((a, b) => b.avgRiskScore - a.avgRiskScore)
    .slice(0, 5);

  const response: StatsResponse = {
    stats,
    timeSeries,
    blockRate,
    topRiskIps,
    recentEvents,
  };

  return NextResponse.json(response);
}
