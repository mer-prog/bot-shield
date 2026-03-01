'use client';

import { useEffect, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TurnstileWidgetProps {
  /** トークン取得成功時コールバック */
  onSuccess: (token: string) => void;
  /** 検証失敗時コールバック */
  onError?: (error: unknown) => void;
}

interface TurnstileRenderParams {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback': (error: unknown) => void;
  size: 'invisible' | 'normal' | 'compact';
  theme: 'light' | 'dark' | 'auto';
}

interface TurnstileApi {
  render: (
    container: string | HTMLElement,
    params: TurnstileRenderParams,
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    onTurnstileLoad?: () => void;
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TurnstileWidget({ onSuccess, onError }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const handleError = useCallback(
    (error: unknown) => {
      onError?.(error);
    },
    [onError],
  );

  useEffect(() => {
    // 環境変数未設定時はスキップ
    if (!SITE_KEY) {
      console.warn(
        '[TurnstileWidget] NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set – skipping',
      );
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    function renderWidget(): void {
      if (!window.turnstile || !container) return;

      // 既にレンダリング済みなら何もしない
      if (widgetIdRef.current !== null) return;

      widgetIdRef.current = window.turnstile.render(container, {
        sitekey: SITE_KEY,
        callback: onSuccess,
        'error-callback': handleError,
        size: 'invisible',
        theme: 'auto',
      });
    }

    // Turnstile スクリプトが既に読み込まれている場合
    if (window.turnstile) {
      renderWidget();
      return;
    }

    // スクリプトが未読み込みの場合、コールバックを設定してロード
    window.onTurnstileLoad = renderWidget;

    const existingScript = document.querySelector(
      `script[src^="https://challenges.cloudflare.com/turnstile"]`,
    );
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      document.head.appendChild(script);
    }

    return () => {
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onSuccess, handleError]);

  // 環境変数未設定時は何もレンダリングしない
  if (!SITE_KEY) return null;

  return <div ref={containerRef} />;
}
