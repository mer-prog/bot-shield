import type { BotSignals, RiskLevel, ActionType } from './types';
import { BOT_SHIELD_CONFIG, MAX_RISK_SCORE, MIN_RISK_SCORE } from './config';

export interface ScoreBreakdown {
  signal: string;
  contribution: number;
}

export interface RiskScoreResult {
  score: number;
  level: RiskLevel;
  action: ActionType;
  breakdown: ScoreBreakdown[];
}

const SIGNAL_LABELS: Record<keyof BotSignals, string> = {
  botdAutomation: 'BotD自動化ツール検出',
  turnstileFailed: 'Turnstile失敗',
  rateLimitExceeded: 'Rate Limit超過',
  noMouseMovement: 'マウス移動なし',
  rapidPurchases: '同一IP短時間複数購入',
  shortDwellTime: 'ページ滞在時間不足',
  abnormalKeyboard: 'キーボードパターン異常',
  suspiciousUserAgent: 'User-Agent異常',
};

/** CLAUDE.md スコアリングアルゴリズムに完全準拠 */
export function calculateRiskScore(signals: BotSignals): RiskScoreResult {
  const { weights, thresholds } = BOT_SHIELD_CONFIG.scoring;
  const breakdown: ScoreBreakdown[] = [];

  let rawScore = 0;

  for (const key of Object.keys(weights) as (keyof BotSignals)[]) {
    if (!signals[key]) continue;

    const { baseScore, multiplier } = weights[key];
    const contribution = Math.round(baseScore * multiplier);
    rawScore += contribution;

    breakdown.push({
      signal: SIGNAL_LABELS[key],
      contribution,
    });
  }

  const score = Math.min(MAX_RISK_SCORE, Math.max(MIN_RISK_SCORE, rawScore));

  const level = scoreToLevel(score, thresholds);
  const action = levelToAction(level);

  return { score, level, action, breakdown };
}

function scoreToLevel(
  score: number,
  thresholds: { allow: number; flag: number; challenge: number },
): RiskLevel {
  if (score <= thresholds.allow) return 'low';
  if (score <= thresholds.flag) return 'medium';
  if (score <= thresholds.challenge) return 'high';
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
