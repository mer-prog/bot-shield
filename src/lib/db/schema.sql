-- BOT Shield Database Schema
-- PostgreSQL 14+

-- bot_events: BOT検出イベントの記録
CREATE TABLE IF NOT EXISTS bot_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      VARCHAR(255) NOT NULL,
    ip_address      INET NOT NULL,
    user_agent      TEXT NOT NULL DEFAULT '',
    path            VARCHAR(1024) NOT NULL,
    signals         JSONB NOT NULL DEFAULT '{}',
    risk_score      SMALLINT NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    risk_level      VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    action          VARCHAR(20) NOT NULL CHECK (action IN ('allow', 'flag', 'challenge', 'block')),
    fingerprint_id  VARCHAR(255),
    turnstile_token TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_events_created_at ON bot_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_events_ip_address ON bot_events (ip_address);
CREATE INDEX IF NOT EXISTS idx_bot_events_session_id ON bot_events (session_id);
CREATE INDEX IF NOT EXISTS idx_bot_events_risk_level ON bot_events (risk_level);
CREATE INDEX IF NOT EXISTS idx_bot_events_action ON bot_events (action);
CREATE INDEX IF NOT EXISTS idx_bot_events_signals ON bot_events USING GIN (signals);

-- purchase_attempts: 購入試行の記録
CREATE TABLE IF NOT EXISTS purchase_attempts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_event_id    UUID NOT NULL REFERENCES bot_events(id) ON DELETE CASCADE,
    product_id      VARCHAR(255) NOT NULL,
    quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    status          VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    ip_address      INET NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_attempts_bot_event_id ON purchase_attempts (bot_event_id);
CREATE INDEX IF NOT EXISTS idx_purchase_attempts_ip_address ON purchase_attempts (ip_address);
CREATE INDEX IF NOT EXISTS idx_purchase_attempts_created_at ON purchase_attempts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_attempts_status ON purchase_attempts (status);

-- ip_blocklist: IPブロックリスト（TTL対応）
CREATE TABLE IF NOT EXISTS ip_blocklist (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address      INET NOT NULL UNIQUE,
    reason          TEXT NOT NULL,
    blocked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,
    created_by      VARCHAR(255) NOT NULL DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_ip_blocklist_ip_address ON ip_blocklist (ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_blocklist_expires_at ON ip_blocklist (expires_at)
    WHERE expires_at IS NOT NULL;

-- bot_shield_config: 設定管理（key-value形式）
CREATE TABLE IF NOT EXISTS bot_shield_config (
    key             VARCHAR(255) PRIMARY KEY,
    value           JSONB NOT NULL,
    description     TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- デフォルト設定
INSERT INTO bot_shield_config (key, value, description) VALUES
    ('scoring.thresholds', '{"allow": 39, "flag": 59, "challenge": 79, "block": 100}',
     'リスクスコアのしきい値'),
    ('scoring.weights.botdAutomation', '{"baseScore": 50, "multiplier": 1.0}',
     'BotD自動化ツール検出のスコア'),
    ('scoring.weights.turnstileFailed', '{"baseScore": 40, "multiplier": 1.0}',
     'Turnstile失敗のスコア'),
    ('scoring.weights.rateLimitExceeded', '{"baseScore": 35, "multiplier": 0.9}',
     'Rate Limit超過のスコア'),
    ('scoring.weights.noMouseMovement', '{"baseScore": 30, "multiplier": 0.8}',
     'マウス移動なしのスコア'),
    ('scoring.weights.rapidPurchases', '{"baseScore": 30, "multiplier": 0.8}',
     '同一IP短時間複数購入のスコア'),
    ('scoring.weights.shortDwellTime', '{"baseScore": 25, "multiplier": 0.9}',
     'ページ滞在時間が短いスコア'),
    ('scoring.weights.abnormalKeyboard', '{"baseScore": 20, "multiplier": 0.7}',
     'キーボードパターン異常のスコア'),
    ('scoring.weights.suspiciousUserAgent', '{"baseScore": 15, "multiplier": 0.6}',
     'User-Agent異常のスコア'),
    ('rateLimit', '{"maxRequests": 60, "windowSeconds": 60}',
     'レートリミット設定'),
    ('minDwellTimeSeconds', '2',
     '最小ページ滞在時間（秒）'),
    ('maxPurchasesPerWindow', '3',
     'ウィンドウ内最大購入数')
ON CONFLICT (key) DO NOTHING;
