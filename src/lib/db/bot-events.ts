import type {
  BotEvent,
  BotSignals,
  RiskLevel,
  ActionType,
  DashboardStats,
  TimeSeriesDataPoint,
} from '@/lib/bot-shield/types';

// ---------------------------------------------------------------------------
// PostgreSQL connection (pg) — optional; falls back to in-memory store
// ---------------------------------------------------------------------------

interface PoolLike {
  query<R extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ): Promise<{ rows: R[]; rowCount: number }>;
}

let pool: PoolLike | null = null;

async function getPool(): Promise<PoolLike | null> {
  if (pool) return pool;

  if (!process.env.DATABASE_URL) return null;

  try {
    // Dynamic import so the module loads even when pg is not installed
    const { Pool } = await import('pg');
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    return pool;
  } catch {
    console.warn('[bot-shield] pg not available – using in-memory fallback');
    return null;
  }
}

// ---------------------------------------------------------------------------
// In-memory fallback (demo / development)
// ---------------------------------------------------------------------------

interface BlocklistEntry {
  ipAddress: string;
  reason: string;
  blockedAt: Date;
  expiresAt: Date | null;
}

const memoryStore = {
  events: [] as BotEvent[],
  blocklist: [] as BlocklistEntry[],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RecordBotEventInput {
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  path: string;
  signals: BotSignals;
  riskScore: number;
  riskLevel: RiskLevel;
  action: ActionType;
  fingerprintId?: string | null;
  turnstileToken?: string | null;
}

/** イベントを記録し、生成されたIDを返す */
export async function recordBotEvent(
  event: RecordBotEventInput,
): Promise<string> {
  const db = await getPool();

  if (db) {
    const { rows } = await db.query<{ id: string }>(
      `INSERT INTO bot_events
         (session_id, ip_address, user_agent, path, signals,
          risk_score, risk_level, action, fingerprint_id, turnstile_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        event.sessionId,
        event.ipAddress,
        event.userAgent,
        event.path,
        JSON.stringify(event.signals),
        event.riskScore,
        event.riskLevel,
        event.action,
        event.fingerprintId ?? null,
        event.turnstileToken ?? null,
      ],
    );
    return rows[0].id;
  }

  // In-memory fallback
  const id = crypto.randomUUID();
  memoryStore.events.push({
    id,
    sessionId: event.sessionId,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    path: event.path,
    signals: event.signals,
    riskScore: event.riskScore,
    riskLevel: event.riskLevel,
    action: event.action,
    fingerprintId: event.fingerprintId ?? null,
    turnstileToken: event.turnstileToken ?? null,
    createdAt: new Date(),
  });
  return id;
}

/** 直近イベントを取得 */
export async function getRecentEvents(
  limit: number = 50,
): Promise<BotEvent[]> {
  const db = await getPool();

  if (db) {
    const { rows } = await db.query<{
      id: string;
      session_id: string;
      ip_address: string;
      user_agent: string;
      path: string;
      signals: BotSignals;
      risk_score: number;
      risk_level: RiskLevel;
      action: ActionType;
      fingerprint_id: string | null;
      turnstile_token: string | null;
      created_at: string;
    }>(
      `SELECT id, session_id, ip_address, user_agent, path, signals,
              risk_score, risk_level, action, fingerprint_id,
              turnstile_token, created_at
       FROM bot_events
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit],
    );

    return rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      ipAddress: r.ip_address,
      userAgent: r.user_agent,
      path: r.path,
      signals: r.signals,
      riskScore: r.risk_score,
      riskLevel: r.risk_level,
      action: r.action,
      fingerprintId: r.fingerprint_id,
      turnstileToken: r.turnstile_token,
      createdAt: new Date(r.created_at),
    }));
  }

  // In-memory fallback
  return memoryStore.events
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

/** 統計集計 */
export async function getEventStats(
  timeRange: '1h' | '24h' | '7d' | '30d' = '24h',
): Promise<{ stats: DashboardStats; timeSeries: TimeSeriesDataPoint[] }> {
  const intervalMap: Record<string, string> = {
    '1h': '1 hour',
    '24h': '24 hours',
    '7d': '7 days',
    '30d': '30 days',
  };

  const db = await getPool();

  if (db) {
    const interval = intervalMap[timeRange];

    const [statsResult, timeSeriesResult, topSignalsResult] = await Promise.all(
      [
        db.query<{
          total_events: string;
          blocked_count: string;
          challenged_count: string;
          flagged_count: string;
          allowed_count: string;
          average_risk_score: string;
        }>(
          `SELECT
             COUNT(*)                                        AS total_events,
             COUNT(*) FILTER (WHERE action = 'block')       AS blocked_count,
             COUNT(*) FILTER (WHERE action = 'challenge')   AS challenged_count,
             COUNT(*) FILTER (WHERE action = 'flag')        AS flagged_count,
             COUNT(*) FILTER (WHERE action = 'allow')       AS allowed_count,
             COALESCE(AVG(risk_score), 0)                   AS average_risk_score
           FROM bot_events
           WHERE created_at >= NOW() - $1::interval`,
          [interval],
        ),

        db.query<{
          bucket: string;
          total: string;
          blocked: string;
          challenged: string;
          flagged: string;
          allowed: string;
        }>(
          `SELECT
             date_trunc('hour', created_at)                  AS bucket,
             COUNT(*)                                        AS total,
             COUNT(*) FILTER (WHERE action = 'block')        AS blocked,
             COUNT(*) FILTER (WHERE action = 'challenge')    AS challenged,
             COUNT(*) FILTER (WHERE action = 'flag')         AS flagged,
             COUNT(*) FILTER (WHERE action = 'allow')        AS allowed
           FROM bot_events
           WHERE created_at >= NOW() - $1::interval
           GROUP BY bucket
           ORDER BY bucket`,
          [interval],
        ),

        db.query<{ signal: string; count: string }>(
          `SELECT key AS signal, COUNT(*) AS count
           FROM bot_events,
                jsonb_each_text(signals) AS kv(key, value)
           WHERE created_at >= NOW() - $1::interval
             AND kv.value = 'true'
           GROUP BY key
           ORDER BY count DESC
           LIMIT 10`,
          [interval],
        ),
      ],
    );

    const s = statsResult.rows[0];

    return {
      stats: {
        totalEvents: Number(s.total_events),
        blockedCount: Number(s.blocked_count),
        challengedCount: Number(s.challenged_count),
        flaggedCount: Number(s.flagged_count),
        allowedCount: Number(s.allowed_count),
        averageRiskScore: Math.round(Number(s.average_risk_score)),
        topSignals: topSignalsResult.rows.map((r) => ({
          signal: r.signal as keyof BotSignals,
          count: Number(r.count),
        })),
      },
      timeSeries: timeSeriesResult.rows.map((r) => ({
        timestamp: r.bucket,
        total: Number(r.total),
        blocked: Number(r.blocked),
        challenged: Number(r.challenged),
        flagged: Number(r.flagged),
        allowed: Number(r.allowed),
      })),
    };
  }

  // In-memory fallback
  const msMap: Record<string, number> = {
    '1h': 3_600_000,
    '24h': 86_400_000,
    '7d': 604_800_000,
    '30d': 2_592_000_000,
  };
  const cutoff = Date.now() - msMap[timeRange];
  const filtered = memoryStore.events.filter(
    (e) => e.createdAt.getTime() >= cutoff,
  );

  const signalCounts: Record<string, number> = {};
  for (const e of filtered) {
    for (const [key, val] of Object.entries(e.signals)) {
      if (val) {
        signalCounts[key] = (signalCounts[key] ?? 0) + 1;
      }
    }
  }

  const topSignals = Object.entries(signalCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([signal, count]) => ({
      signal: signal as keyof BotSignals,
      count,
    }));

  const totalEvents = filtered.length;
  const blockedCount = filtered.filter((e) => e.action === 'block').length;
  const challengedCount = filtered.filter(
    (e) => e.action === 'challenge',
  ).length;
  const flaggedCount = filtered.filter((e) => e.action === 'flag').length;
  const allowedCount = filtered.filter((e) => e.action === 'allow').length;
  const averageRiskScore =
    totalEvents > 0
      ? Math.round(
          filtered.reduce((sum, e) => sum + e.riskScore, 0) / totalEvents,
        )
      : 0;

  // Build simple hourly buckets
  const buckets = new Map<string, TimeSeriesDataPoint>();
  for (const e of filtered) {
    const hour = new Date(e.createdAt);
    hour.setMinutes(0, 0, 0);
    const key = hour.toISOString();
    const bucket = buckets.get(key) ?? {
      timestamp: key,
      total: 0,
      blocked: 0,
      challenged: 0,
      flagged: 0,
      allowed: 0,
    };
    bucket.total++;
    if (e.action === 'block') bucket.blocked++;
    if (e.action === 'challenge') bucket.challenged++;
    if (e.action === 'flag') bucket.flagged++;
    if (e.action === 'allow') bucket.allowed++;
    buckets.set(key, bucket);
  }

  return {
    stats: {
      totalEvents,
      blockedCount,
      challengedCount,
      flaggedCount,
      allowedCount,
      averageRiskScore,
      topSignals,
    },
    timeSeries: Array.from(buckets.values()).sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp),
    ),
  };
}

/** IPがブロックリストに含まれるか確認（TTL考慮） */
export async function checkIpBlocklist(ip: string): Promise<boolean> {
  const db = await getPool();

  if (db) {
    const { rows } = await db.query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM ip_blocklist
         WHERE ip_address = $1
           AND (expires_at IS NULL OR expires_at > NOW())
       ) AS exists`,
      [ip],
    );
    return rows[0].exists;
  }

  // In-memory fallback
  const now = Date.now();
  return memoryStore.blocklist.some(
    (entry) =>
      entry.ipAddress === ip &&
      (entry.expiresAt === null || entry.expiresAt.getTime() > now),
  );
}

/** IPをブロックリストに追加。duration（秒）省略時は無期限 */
export async function addToBlocklist(
  ip: string,
  reason: string,
  duration?: number,
): Promise<void> {
  const expiresAt = duration
    ? new Date(Date.now() + duration * 1000)
    : null;

  const db = await getPool();

  if (db) {
    await db.query(
      `INSERT INTO ip_blocklist (ip_address, reason, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (ip_address) DO UPDATE
         SET reason     = EXCLUDED.reason,
             blocked_at = NOW(),
             expires_at = EXCLUDED.expires_at`,
      [ip, reason, expiresAt],
    );
    return;
  }

  // In-memory fallback
  const idx = memoryStore.blocklist.findIndex((e) => e.ipAddress === ip);
  const entry: BlocklistEntry = {
    ipAddress: ip,
    reason,
    blockedAt: new Date(),
    expiresAt,
  };
  if (idx >= 0) {
    memoryStore.blocklist[idx] = entry;
  } else {
    memoryStore.blocklist.push(entry);
  }
}
