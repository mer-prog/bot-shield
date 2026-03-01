export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ActionType = 'allow' | 'flag' | 'challenge' | 'block';

export interface BotSignals {
  /** BotD detected automation tool */
  botdAutomation: boolean;
  /** Turnstile challenge failed */
  turnstileFailed: boolean;
  /** Rate limit exceeded */
  rateLimitExceeded: boolean;
  /** No mouse movement detected on page */
  noMouseMovement: boolean;
  /** Multiple purchases from same IP in short period */
  rapidPurchases: boolean;
  /** Page dwell time less than threshold */
  shortDwellTime: boolean;
  /** Abnormal keyboard input pattern */
  abnormalKeyboard: boolean;
  /** Suspicious or missing User-Agent */
  suspiciousUserAgent: boolean;
}

export interface BotEvent {
  id: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  path: string;
  signals: BotSignals;
  riskScore: number;
  riskLevel: RiskLevel;
  action: ActionType;
  fingerprintId: string | null;
  turnstileToken: string | null;
  createdAt: Date;
}

export interface SignalWeight {
  /** Base score added when signal is triggered */
  baseScore: number;
  /** Multiplier applied to the base score (0.0 - 1.0) */
  multiplier: number;
}

export interface ScoringThresholds {
  allow: number;
  flag: number;
  challenge: number;
  block: number;
}

export interface RateLimitConfig {
  /** Maximum requests allowed within the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
}

export interface BotShieldConfig {
  scoring: {
    thresholds: ScoringThresholds;
    weights: Record<keyof BotSignals, SignalWeight>;
  };
  rateLimit: RateLimitConfig;
  /** Minimum page dwell time in seconds before flagging */
  minDwellTimeSeconds: number;
  /** Maximum purchases from same IP within the rate limit window */
  maxPurchasesPerWindow: number;
}

export interface DashboardStats {
  totalEvents: number;
  blockedCount: number;
  challengedCount: number;
  flaggedCount: number;
  allowedCount: number;
  averageRiskScore: number;
  topSignals: Array<{ signal: keyof BotSignals; count: number }>;
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  total: number;
  blocked: number;
  challenged: number;
  flagged: number;
  allowed: number;
}
