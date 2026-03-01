import type { BotShieldConfig, RiskLevel, ActionType, ScoreThresholds } from './types';

/** Default score thresholds defining action boundaries */
const SCORE_THRESHOLDS: ScoreThresholds = {
  flag: 40,
  challenge: 60,
  block: 80,
};

/** Default BOT Shield configuration aligned with scoring algorithm spec */
export const DEFAULT_CONFIG: BotShieldConfig = {
  thresholds: SCORE_THRESHOLDS,
  weights: {
    botdAutomation:    { baseScore: 50, multiplier: 1.0 },
    turnstileFailed:   { baseScore: 40, multiplier: 1.0 },
    rateLimitExceeded: { baseScore: 35, multiplier: 0.9 },
    noMouseMovement:   { baseScore: 30, multiplier: 0.8 },
    rapidPurchases:    { baseScore: 30, multiplier: 0.8 },
    shortDwellTime:    { baseScore: 25, multiplier: 0.9 },
    abnormalKeyboard:  { baseScore: 20, multiplier: 0.7 },
    suspiciousUserAgent: { baseScore: 15, multiplier: 0.6 },
  },
  rateLimit: {
    maxRequests: 60,
    windowMs: 60_000,
  },
  minDwellTimeMs: 2_000,
  purchaseLimit: {
    maxPurchases: 3,
    windowMs: 300_000,
  },
};

/** Maximum possible risk score (capped) */
export const MAX_RISK_SCORE = 100;

/** Derive risk level from numeric score */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= SCORE_THRESHOLDS.block) return 'critical';
  if (score >= SCORE_THRESHOLDS.challenge) return 'high';
  if (score >= SCORE_THRESHOLDS.flag) return 'medium';
  return 'low';
}

/** Derive action from numeric score */
export function getAction(score: number): ActionType {
  if (score >= SCORE_THRESHOLDS.block) return 'block';
  if (score >= SCORE_THRESHOLDS.challenge) return 'challenge';
  if (score >= SCORE_THRESHOLDS.flag) return 'flag';
  return 'allow';
}
