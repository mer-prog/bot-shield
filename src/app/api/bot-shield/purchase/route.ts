import { NextRequest, NextResponse } from 'next/server';
import type { BotSignals, ActionType } from '@/lib/bot-shield/types';
import { calculateRiskScore } from '@/lib/bot-shield/scorer';
import { BOT_SHIELD_CONFIG } from '@/lib/bot-shield/config';
import {
  recordBotEvent,
  getRecentEvents,
  checkIpBlocklist,
  addToBlocklist,
} from '@/lib/db/bot-events';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PurchaseRequestBody {
  productId: string;
  quantity?: number;
  signals: BotSignals;
  sessionId?: string;
  fingerprintId?: string;
  turnstileToken?: string;
}

interface PurchaseResponse {
  success: boolean;
  action: ActionType;
  risk_score: number;
  risk_level: string;
  event_id: string;
  message: string;
  requireChallenge?: boolean;
}

// ---------------------------------------------------------------------------
// POST /api/bot-shield/purchase
// 購入リクエスト処理: スコアに応じたアクション分岐
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
): Promise<NextResponse<PurchaseResponse>> {
  let body: PurchaseRequestBody;
  try {
    body = (await request.json()) as PurchaseRequestBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        action: 'block' as const,
        risk_score: 0,
        risk_level: 'critical',
        event_id: '',
        message: 'Invalid JSON body',
      },
      { status: 400 },
    );
  }

  if (!body.productId || typeof body.productId !== 'string') {
    return NextResponse.json(
      {
        success: false,
        action: 'block' as const,
        risk_score: 0,
        risk_level: 'critical',
        event_id: '',
        message: 'Missing or invalid productId',
      },
      { status: 400 },
    );
  }

  const ip = request.headers.get('x-bot-shield-ip') ?? '127.0.0.1';
  const ua = request.headers.get('user-agent') ?? '';
  const suspiciousUa =
    request.headers.get('x-bot-shield-suspicious-ua') === 'true';

  // --- IP ブロックリスト確認 ---
  const isBlocked = await checkIpBlocklist(ip);
  if (isBlocked) {
    const eventId = await recordBotEvent({
      sessionId: body.sessionId ?? crypto.randomUUID(),
      ipAddress: ip,
      userAgent: ua,
      path: `/api/bot-shield/purchase`,
      signals: {
        ...body.signals,
        suspiciousUserAgent: suspiciousUa,
      },
      riskScore: 100,
      riskLevel: 'critical',
      action: 'block',
      fingerprintId: body.fingerprintId,
      turnstileToken: body.turnstileToken,
    });

    return NextResponse.json(
      {
        success: false,
        action: 'block',
        risk_score: 100,
        risk_level: 'critical',
        event_id: eventId,
        message: 'IP is blocked',
      },
      { status: 403 },
    );
  }

  // --- 同一 IP 短時間複数購入チェック ---
  const recentEvents = await getRecentEvents(100);
  const windowMs = BOT_SHIELD_CONFIG.rateLimit.windowSeconds * 1000;
  const cutoff = Date.now() - windowMs;
  const recentPurchasesFromIp = recentEvents.filter(
    (e) =>
      e.ipAddress === ip &&
      e.path === '/api/bot-shield/purchase' &&
      e.createdAt.getTime() >= cutoff,
  );
  const rapidPurchases =
    recentPurchasesFromIp.length >= BOT_SHIELD_CONFIG.maxPurchasesPerWindow;

  // --- シグナル統合 & スコアリング ---
  const signals: BotSignals = {
    ...body.signals,
    suspiciousUserAgent: body.signals.suspiciousUserAgent || suspiciousUa,
    rapidPurchases: body.signals.rapidPurchases || rapidPurchases,
  };

  const { score, level, action } = calculateRiskScore(signals);
  const sessionId = body.sessionId ?? crypto.randomUUID();

  const eventId = await recordBotEvent({
    sessionId,
    ipAddress: ip,
    userAgent: ua,
    path: '/api/bot-shield/purchase',
    signals,
    riskScore: score,
    riskLevel: level,
    action,
    fingerprintId: body.fingerprintId,
    turnstileToken: body.turnstileToken,
  });

  // --- アクション分岐 ---
  switch (action) {
    case 'allow':
      return NextResponse.json({
        success: true,
        action,
        risk_score: score,
        risk_level: level,
        event_id: eventId,
        message: 'Purchase approved',
      });

    case 'flag':
      return NextResponse.json({
        success: true,
        action,
        risk_score: score,
        risk_level: level,
        event_id: eventId,
        message: 'Purchase approved with flag for review',
      });

    case 'challenge':
      return NextResponse.json(
        {
          success: false,
          action,
          risk_score: score,
          risk_level: level,
          event_id: eventId,
          message: 'Additional verification required',
          requireChallenge: true,
        },
        { status: 403 },
      );

    case 'block': {
      // 連続ブロック時は IP をブロックリストに追加（1時間）
      if (rapidPurchases) {
        await addToBlocklist(ip, 'Rapid purchase attempts blocked', 3600);
      }
      return NextResponse.json(
        {
          success: false,
          action,
          risk_score: score,
          risk_level: level,
          event_id: eventId,
          message: 'Purchase blocked due to suspicious activity',
        },
        { status: 403 },
      );
    }
  }
}
