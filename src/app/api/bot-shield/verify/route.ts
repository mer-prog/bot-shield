import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes': string[];
  challenge_ts?: string;
  hostname?: string;
}

interface VerifyRequestBody {
  token: string;
}

// ---------------------------------------------------------------------------
// POST /api/bot-shield/verify
// Turnstile トークンのサーバーサイド検証
// ---------------------------------------------------------------------------

const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function POST(request: NextRequest) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json(
      { success: false, error: 'Turnstile secret key not configured' },
      { status: 500 },
    );
  }

  let body: VerifyRequestBody;
  try {
    body = (await request.json()) as VerifyRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  if (!body.token || typeof body.token !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid token' },
      { status: 400 },
    );
  }

  const ip = request.headers.get('x-bot-shield-ip') ?? '127.0.0.1';

  const formData = new URLSearchParams();
  formData.append('secret', secretKey);
  formData.append('response', body.token);
  formData.append('remoteip', ip);

  const verifyResponse = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });

  const result = (await verifyResponse.json()) as TurnstileVerifyResponse;

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Turnstile verification failed',
        errorCodes: result['error-codes'],
      },
      { status: 403 },
    );
  }

  return NextResponse.json({
    success: true,
    challengeTs: result.challenge_ts,
    hostname: result.hostname,
  });
}
