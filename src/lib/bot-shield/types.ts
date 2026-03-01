export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ActionType = 'allow' | 'flag' | 'challenge' | 'block';

export interface BotSignals {
  /** BotD が自動化ツールを検出したか */
  botDetected: boolean;
  /** Turnstile チャレンジに失敗したか */
  turnstileFailed: boolean;
  /** Rate Limit を超過したか */
  rateLimitExceeded: boolean;
  /** マウス移動が検出されなかったか */
  noMouseMovement: boolean;
  /** 同一IPから短時間に複数購入が発生したか */
  rapidPurchases: boolean;
  /** ページ滞在時間（秒） */
  dwellTimeSeconds: number;
  /** キーボード入力パターンが異常か */
  abnormalKeyboardPattern: boolean;
  /** User-Agent が異常か */
  abnormalUserAgent: boolean;
}

export interface SignalWeight {
  /** 基礎スコア加算値 */
  baseScore: number;
  /** 重み係数 (0.0 - 1.0) */
  weight: number;
}

export interface ScoringThresholds {
  /** ALLOW の上限 (この値以下は ALLOW) */
  allow: number;
  /** FLAG の上限 (この値以下は FLAG) */
  flag: number;
  /** CHALLENGE の上限 (この値以下は CHALLENGE) */
  challenge: number;
}

export interface BotEvent {
  id: string;
  timestamp: Date;
  ip: string;
  userAgent: string;
  path: string;
  signals: BotSignals;
  riskScore: number;
  riskLevel: RiskLevel;
  action: ActionType;
  fingerprintId: string | null;
  sessionId: string;
  metadata: Record<string, unknown>;
}

export interface BotShieldConfig {
  thresholds: ScoringThresholds;
  signalWeights: Record<keyof Omit<BotSignals, 'dwellTimeSeconds'>, SignalWeight> & {
    shortDwellTime: SignalWeight;
  };
  /** ページ滞在時間の下限（秒）。これ未満は短時間とみなす */
  minDwellTimeSeconds: number;
  /** Rate Limit: 時間ウィンドウ（秒） */
  rateLimitWindowSeconds: number;
  /** Rate Limit: ウィンドウあたりの最大リクエスト数 */
  rateLimitMaxRequests: number;
}

export interface ScoringResult {
  score: number;
  riskLevel: RiskLevel;
  action: ActionType;
  triggeredSignals: string[];
}

export interface DashboardStats {
  totalRequests: number;
  blockedRequests: number;
  challengedRequests: number;
  flaggedRequests: number;
  allowedRequests: number;
  blockRate: number;
  topRiskIps: Array<{ ip: string; count: number; avgScore: number }>;
}
