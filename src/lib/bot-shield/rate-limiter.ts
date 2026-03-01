/**
 * Edge Runtime 互換のインメモリ Rate Limiter
 * IP 単位の sliding window 方式
 */

const DEFAULT_MAX_REQUESTS = 30;
const DEFAULT_WINDOW_MS = 60_000; // 1分
const CLEANUP_INTERVAL_MS = 300_000; // 5分

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** ウィンドウリセットまでのミリ秒 */
  resetMs: number;
}

// IP → リクエストタイムスタンプ配列
const store = new Map<string, number[]>();
let lastCleanupAt = Date.now();

/** 5分経過していたら古いエントリを一括削除 */
function cleanupIfNeeded(windowMs: number): void {
  const now = Date.now();
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;

  lastCleanupAt = now;
  const cutoff = now - windowMs;

  for (const [ip, timestamps] of store) {
    const fresh = timestamps.filter((t) => t > cutoff);
    if (fresh.length === 0) {
      store.delete(ip);
    } else {
      store.set(ip, fresh);
    }
  }
}

/** IP に対するリクエストを判定し、許可/拒否を返す */
export function checkRateLimit(
  ip: string,
  maxRequests: number = DEFAULT_MAX_REQUESTS,
  windowMs: number = DEFAULT_WINDOW_MS,
): RateLimitResult {
  cleanupIfNeeded(windowMs);

  const now = Date.now();
  const cutoff = now - windowMs;

  // ウィンドウ内のタイムスタンプだけ残す
  const timestamps = (store.get(ip) ?? []).filter((t) => t > cutoff);

  if (timestamps.length >= maxRequests) {
    store.set(ip, timestamps);
    const oldestInWindow = timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetMs: oldestInWindow + windowMs - now,
    };
  }

  timestamps.push(now);
  store.set(ip, timestamps);

  return {
    allowed: true,
    remaining: maxRequests - timestamps.length,
    resetMs: timestamps[0] + windowMs - now,
  };
}
