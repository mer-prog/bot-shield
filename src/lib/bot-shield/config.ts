import type { BotShieldConfig } from './types';

export const BOT_SHIELD_CONFIG: BotShieldConfig = {
  scoring: {
    thresholds: {
      allow: 39,
      flag: 59,
      challenge: 79,
      block: 100,
    },
    weights: {
      botdAutomation: { baseScore: 50, multiplier: 1.0 },
      turnstileFailed: { baseScore: 40, multiplier: 1.0 },
      rateLimitExceeded: { baseScore: 35, multiplier: 0.9 },
      noMouseMovement: { baseScore: 30, multiplier: 0.8 },
      rapidPurchases: { baseScore: 30, multiplier: 0.8 },
      shortDwellTime: { baseScore: 25, multiplier: 0.9 },
      abnormalKeyboard: { baseScore: 20, multiplier: 0.7 },
      suspiciousUserAgent: { baseScore: 15, multiplier: 0.6 },
    },
  },
  rateLimit: {
    maxRequests: 60,
    windowSeconds: 60,
  },
  minDwellTimeSeconds: 2,
  maxPurchasesPerWindow: 3,
};

export const MAX_RISK_SCORE = 100;
export const MIN_RISK_SCORE = 0;
