import { NextRequest, NextResponse } from 'next/server';
import type { BotSignals } from '@/lib/bot-shield/types';
import { calculateRiskScore } from '@/lib/bot-shield/scorer';
import { recordBotEvent } from '@/lib/db/bot-events';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EventRequestBody {
  signals: BotSignals;
  path: string;
  sessionId?: string;
  fingerprintId?: string;
  turnstileToken?: string;
  metadata?: Record<string, unknown>;
}

const SIGNAL_KEYS: (keyof BotSignals)[] = [
  'botdAutomation',
  'turnstileFailed',
  'rateLimitExceeded',
  'noMouseMovement',
  'rapidPurchases',
  'shortDwellTime',
  'abnormalKeyboard',
  'suspiciousUserAgent',
];

function isValidSignals(value: unknown): value is BotSignals {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return SIGNAL_KEYS.every((key) => typeof obj[key] === 'boolean');
}

// ---------------------------------------------------------------------------
// POST /api/bot-shield/event
// クライアントから行動シグナル受信 → スコアリング → DB 記録
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let body: EventRequestBody;
  try {
    body = (await request.json()) as EventRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  if (!isValidSignals(body.signals)) {
    return NextResponse.json(
      { error: 'Invalid or missing signals' },
      { status: 400 },
    );
  }

  if (!body.path || typeof body.path !== 'string') {
    return NextResponse.json(
      { error: 'Missing or invalid path' },
      { status: 400 },
    );
  }

  // ミドルウェアが設定したヘッダーからサーバーサイドシグナルを注入
  const ip = request.headers.get('x-bot-shield-ip') ?? '127.0.0.1';
  const ua = request.headers.get('user-agent') ?? '';
  const suspiciousUa =
    request.headers.get('x-bot-shield-suspicious-ua') === 'true';

  const signals: BotSignals = {
    ...body.signals,
    suspiciousUserAgent: body.signals.suspiciousUserAgent || suspiciousUa,
  };

  const { score, level, action } = calculateRiskScore(signals);

  const sessionId = body.sessionId ?? crypto.randomUUID();

  const eventId = await recordBotEvent({
    sessionId,
    ipAddress: ip,
    userAgent: ua,
    path: body.path,
    signals,
    riskScore: score,
    riskLevel: level,
    action,
    fingerprintId: body.fingerprintId,
    turnstileToken: body.turnstileToken,
  });

  return NextResponse.json({
    event_id: eventId,
    risk_score: score,
    risk_level: level,
    action,
  });
}
