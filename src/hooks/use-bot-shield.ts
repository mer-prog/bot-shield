'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { BotSignals, RiskLevel } from '@/lib/bot-shield/types';
import { calculateRiskScore } from '@/lib/bot-shield/scorer';
import { BOT_SHIELD_CONFIG } from '@/lib/bot-shield/config';

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface MousePoint {
  x: number;
  y: number;
  t: number;
}

interface ClickPoint {
  x: number;
  y: number;
}

interface BehaviorData {
  mousePoints: MousePoint[];
  keyIntervals: number[];
  lastKeyDownAt: number;
  maxScrollDepth: number;
  clicks: ClickPoint[];
  mountedAt: number;
}

export interface UseBotShieldReturn {
  signals: BotSignals;
  riskScore: number;
  riskLevel: RiskLevel;
  isReady: boolean;
  /** 収集したシグナルをサーバーへ送信 */
  reportSignals: () => Promise<void>;
  /** デモ用: BOT モードを切り替え */
  simulateBotMode: (enabled: boolean) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MOUSE_THROTTLE_MS = 50;
const SCROLL_THROTTLE_MS = 100;
const ANALYSIS_INTERVAL_MS = 1_000;

/** エントロピー計算に必要な最低マウスポイント数 */
const MIN_MOUSE_POINTS = 5;
/** キーボード異常判定に必要な最低サンプル数 */
const MIN_KEY_SAMPLES = 5;

/** マウス角度変化の分散がこの値未満なら直線的（BOT 的） */
const MOUSE_ENTROPY_THRESHOLD = 0.01;
/** キーボード変動係数がこの値未満なら均一（BOT 的） */
const KEYBOARD_CV_THRESHOLD = 0.1;

/** メモリ上限 */
const MAX_MOUSE_POINTS = 200;
const MAX_KEY_INTERVALS = 100;
const MAX_CLICKS = 50;

const DEFAULT_SIGNALS: BotSignals = {
  botdAutomation: false,
  turnstileFailed: false,
  rateLimitExceeded: false,
  noMouseMovement: true,
  rapidPurchases: false,
  shortDwellTime: true,
  abnormalKeyboard: false,
  suspiciousUserAgent: false,
};

// ---------------------------------------------------------------------------
// Analysis helpers（純関数）
// ---------------------------------------------------------------------------

/**
 * マウス移動エントロピー — 連続する移動ベクトル間の角度変化の分散を算出。
 * 低分散 = 直線的（BOT 的）、高分散 = 自然な曲線（人間的）。
 */
function analyzeMouseMovement(points: MousePoint[]): boolean {
  // ポイント不足 → 動きなし
  if (points.length < MIN_MOUSE_POINTS) return true;

  const angles: number[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    const dx1 = points[i].x - points[i - 1].x;
    const dy1 = points[i].y - points[i - 1].y;
    const dx2 = points[i + 1].x - points[i].x;
    const dy2 = points[i + 1].y - points[i].y;

    const len1 = Math.hypot(dx1, dy1);
    const len2 = Math.hypot(dx2, dy2);
    if (len1 === 0 || len2 === 0) continue;

    angles.push(Math.atan2(dy2, dx2) - Math.atan2(dy1, dx1));
  }

  if (angles.length === 0) return true;

  const mean = angles.reduce((a, b) => a + b, 0) / angles.length;
  const variance =
    angles.reduce((sum, a) => sum + (a - mean) ** 2, 0) / angles.length;

  return variance < MOUSE_ENTROPY_THRESHOLD;
}

/**
 * キーボードタイミング分析 — 変動係数 (CV) で判定。
 * 人間: 50-300ms のばらつき → CV > 0.3
 * BOT: 均一 or 0ms → CV < 0.1
 */
function analyzeKeyboardTiming(intervals: number[]): boolean {
  if (intervals.length < MIN_KEY_SAMPLES) return false;

  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  if (mean === 0) return true; // 全て瞬間入力 → BOT

  const variance =
    intervals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / intervals.length;
  const cv = Math.sqrt(variance) / mean;

  return cv < KEYBOARD_CV_THRESHOLD;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBotShield(): UseBotShieldReturn {
  const dataRef = useRef<BehaviorData>({
    mousePoints: [],
    keyIntervals: [],
    lastKeyDownAt: 0,
    maxScrollDepth: 0,
    clicks: [],
    mountedAt: 0,
  });

  const botModeRef = useRef(false);
  const latestSignalsRef = useRef<BotSignals>(DEFAULT_SIGNALS);

  const [state, setState] = useState({
    signals: DEFAULT_SIGNALS,
    riskScore: 0,
    riskLevel: 'low' as RiskLevel,
    isReady: false,
  });

  // ----- analyze: ref から行動データを読み取り signals を算出 -----
  const analyze = useCallback((): BotSignals => {
    const data = dataRef.current;
    const dwellSec = (Date.now() - data.mountedAt) / 1000;

    // --- デモ用 BOT モード ---
    if (botModeRef.current) {
      const botSignals: BotSignals = {
        botdAutomation: true,
        turnstileFailed: true,
        rateLimitExceeded: false,
        noMouseMovement: true,
        rapidPurchases: false,
        shortDwellTime: true,
        abnormalKeyboard: true,
        suspiciousUserAgent: true,
      };
      const result = calculateRiskScore(botSignals);
      latestSignalsRef.current = botSignals;
      setState({
        signals: botSignals,
        riskScore: result.score,
        riskLevel: result.level,
        isReady: true,
      });
      return botSignals;
    }

    // --- 実行動解析 ---
    const noMouseMovement = analyzeMouseMovement(data.mousePoints);
    const abnormalKeyboard = analyzeKeyboardTiming(data.keyIntervals);
    const shortDwellTime = dwellSec < BOT_SHIELD_CONFIG.minDwellTimeSeconds;

    const signals: BotSignals = {
      botdAutomation: false,
      turnstileFailed: false,
      rateLimitExceeded: false,
      noMouseMovement,
      rapidPurchases: false,
      shortDwellTime,
      abnormalKeyboard,
      suspiciousUserAgent: false,
    };

    const result = calculateRiskScore(signals);
    latestSignalsRef.current = signals;
    setState({
      signals,
      riskScore: result.score,
      riskLevel: result.level,
      isReady: !shortDwellTime,
    });
    return signals;
  }, []);

  // ----- イベントリスナー登録（throttle 付き）+ 定期解析 -----
  useEffect(() => {
    const data = dataRef.current;
    data.mountedAt = Date.now();

    // --- Mouse (throttle 50ms) ---
    let lastMouseAt = 0;
    const onMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMouseAt < MOUSE_THROTTLE_MS) return;
      lastMouseAt = now;
      if (data.mousePoints.length >= MAX_MOUSE_POINTS) {
        data.mousePoints.shift();
      }
      data.mousePoints.push({ x: e.clientX, y: e.clientY, t: now });
    };

    // --- Keyboard ---
    const onKeyDown = () => {
      const now = Date.now();
      if (data.lastKeyDownAt > 0) {
        if (data.keyIntervals.length >= MAX_KEY_INTERVALS) {
          data.keyIntervals.shift();
        }
        data.keyIntervals.push(now - data.lastKeyDownAt);
      }
      data.lastKeyDownAt = now;
    };

    // --- Scroll (throttle 100ms) ---
    let lastScrollAt = 0;
    const onScroll = () => {
      const now = Date.now();
      if (now - lastScrollAt < SCROLL_THROTTLE_MS) return;
      lastScrollAt = now;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const depth = Math.min(1, window.scrollY / docHeight);
        if (depth > data.maxScrollDepth) {
          data.maxScrollDepth = depth;
        }
      }
    };

    // --- Click ---
    const onClick = (e: MouseEvent) => {
      if (data.clicks.length >= MAX_CLICKS) {
        data.clicks.shift();
      }
      data.clicks.push({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('click', onClick);

    const intervalId = window.setInterval(analyze, ANALYSIS_INTERVAL_MS);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', onClick);
      window.clearInterval(intervalId);
    };
  }, [analyze]);

  // ----- reportSignals: 最新解析結果 + メタデータをサーバーへ POST -----
  const reportSignals = useCallback(async () => {
    const signals = analyze();
    const data = dataRef.current;

    await fetch('/api/bot-shield/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signals,
        path: window.location.pathname,
        metadata: {
          mousePointCount: data.mousePoints.length,
          keyIntervalCount: data.keyIntervals.length,
          maxScrollDepth: data.maxScrollDepth,
          clickCount: data.clicks.length,
          dwellTimeSec: (Date.now() - data.mountedAt) / 1000,
        },
      }),
    });
  }, [analyze]);

  // ----- simulateBotMode: デモ用 BOT モード切替 -----
  const simulateBotMode = useCallback(
    (enabled: boolean) => {
      botModeRef.current = enabled;
      analyze();
    },
    [analyze],
  );

  return {
    signals: state.signals,
    riskScore: state.riskScore,
    riskLevel: state.riskLevel,
    isReady: state.isReady,
    reportSignals,
    simulateBotMode,
  };
}
