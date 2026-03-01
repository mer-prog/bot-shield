import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/bot-shield/rate-limiter';

// headless ブラウザ・BOT・クローラー等の UA パターン
const SUSPICIOUS_UA_PATTERNS =
  /headless|bot(?!-shield)|crawler|spider|scraper|curl[\/\s]|wget[\/\s]|python-|httpx|puppeteer|playwright|selenium|phantomjs/i;

export function middleware(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';

  // --- Rate Limit ---
  const { allowed, remaining, resetMs } = checkRateLimit(ip);

  if (!allowed) {
    const retryAfter = String(Math.ceil(resetMs / 1000));
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': retryAfter,
        'X-RateLimit-Remaining': '0',
      },
    });
  }

  // --- Suspicious User-Agent 検出 ---
  const ua = request.headers.get('user-agent') ?? '';
  const suspiciousUa = ua === '' || SUSPICIOUS_UA_PATTERNS.test(ua);

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Remaining', String(remaining));

  if (suspiciousUa) {
    response.headers.set('X-Bot-Shield-Suspicious-UA', 'true');
  }
  response.headers.set('X-Bot-Shield-IP', ip);

  return response;
}

export const config = {
  matcher: [
    // /api/* と商品ページを対象
    '/api/:path*',
    '/products/:path*',
    // /dashboard, /_next, 静的アセットは除外（matcher に含めないことで除外）
  ],
};
