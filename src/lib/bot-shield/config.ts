import type { BotShieldConfig, RiskLevel, ActionType, ScoringThresholds } from './types';

export const DEFAULT_CONFIG: BotShieldConfig = {
  thresholds: {
    allow: 39,
    flag: 59,
    challenge: 79,
  },
  signalWeights: {
    botDetected: { baseScore: 50, weight: 1.0 },
    turnstileFailed: { baseScore: 40, weight: 1.0 },
    rateLimitExceeded: { baseScore: 35, weight: 0.9 },
    noMouseMovement: { baseScore: 30, weight: 0.8 },
    rapidPurchases: { baseScore: 30, weight: 0.8 },
    shortDwellTime: { baseScore: 25, weight: 0.9 },
    abnormalKeyboardPattern: { baseScore: 20, weight: 0.7 },
    abnormalUserAgent: { baseScore: 15, weight: 0.6 },
  },
  minDwellTimeSeconds: 2,
  rateLimitWindowSeconds: 60,
  rateLimitMaxRequests: 10,
};

export function getRiskLevel(score: number, thresholds: ScoringThresholds): RiskLevel {
  if (score <= thresholds.allow) return 'low';
  if (score <= thresholds.flag) return 'medium';
  if (score <= thresholds.challenge) return 'high';
  return 'critical';
}

export function getAction(riskLevel: RiskLevel): ActionType {
  const actionMap: Record<RiskLevel, ActionType> = {
    low: 'allow',
    medium: 'flag',
    high: 'challenge',
    critical: 'block',
  };
  return actionMap[riskLevel];
}
