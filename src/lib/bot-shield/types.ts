/** Risk severity levels mapped to score ranges */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** Actions taken based on risk assessment */
export type ActionType = 'allow' | 'flag' | 'challenge' | 'block';

/** Detection signals collected from multiple layers */
export interface BotSignals {
  /** L2: BotD detected automation tools */
  botdAutomation: boolean;
  /** L2: Turnstile challenge failed */
  turnstileFailed: boolean;
  /** L1: Request rate exceeded threshold */
  rateLimitExceeded: boolean;
  /** L3: No mouse movement detected during session */
  noMouseMovement: boolean;
  /** L4: Multiple purchases from same IP in short window */
  rapidPurchases: boolean;
  /** L3: Page dwell time below minimum threshold */
  shortDwellTime: boolean;
  /** L3: Keyboard input pattern appears automated */
  abnormalKeyboard: boolean;
  /** L1: User-Agent header missing or anomalous */
  suspiciousUserAgent: boolean;
}

/** Complete bot event record persisted to database */
export interface BotEvent {
  id: string;
  sessionId: string;
  ip: string;
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

/** Row returned from database queries (dates as strings) */
export interface BotEventRow {
  id: string;
  session_id: string;
  ip: string;
  user_agent: string;
  path: string;
  signals: BotSignals;
  risk_score: number;
  risk_level: RiskLevel;
  action: ActionType;
  fingerprint_id: string | null;
  turnstile_token: string | null;
  created_at: string;
}

/** Scoring weight for a single signal */
export interface SignalWeight {
  /** Base score added when signal is triggered */
  baseScore: number;
  /** Multiplier applied to base score (0.0-1.0) */
  multiplier: number;
}

/** Score thresholds defining action boundaries */
export interface ScoreThresholds {
  /** Below this: ALLOW */
  flag: number;
  /** Below this: FLAG */
  challenge: number;
  /** Below this: CHALLENGE; at or above: BLOCK */
  block: number;
}

/** Top-level configuration for the BOT Shield system */
export interface BotShieldConfig {
  thresholds: ScoreThresholds;
  weights: Record<keyof BotSignals, SignalWeight>;
  /** Rate limit: max requests per window */
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
  /** Minimum page dwell time in milliseconds */
  minDwellTimeMs: number;
  /** Max purchases from same IP within window */
  purchaseLimit: {
    maxPurchases: number;
    windowMs: number;
  };
}

/** Dashboard statistics summary */
export interface DashboardStats {
  totalRequests: number;
  blockedRequests: number;
  challengedRequests: number;
  flaggedRequests: number;
  blockRate: number;
  avgRiskScore: number;
}

/** Time-series data point for charts */
export interface TimeSeriesPoint {
  timestamp: string;
  allow: number;
  flag: number;
  challenge: number;
  block: number;
}
