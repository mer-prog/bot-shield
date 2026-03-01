# BOT Shield — プロジェクトコンテキスト

## 概要
ECサイト向け多層BOT対策システム。社内販売のBOT購入問題を解決し、将来SaaS化を見据える。

## 技術スタック
- Framework: Next.js 15 (App Router) + TypeScript
- Styling: Tailwind CSS
- DB: PostgreSQL（DATABASE_URL）
- チャレンジ: Cloudflare Turnstile（NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY）
- BOT検出: @fingerprintjs/botd, @fingerprintjs/fingerprintjs
- チャート: recharts

## アーキテクチャ: 5層防御モデル
1. L1 Edge: Next.js Middleware — Rate Limiting, Header検証, IP制限
2. L2 Challenge: Cloudflare Turnstile + BotD — 自動化ツール検出
3. L3 Behavior: React Hook (useBotShield) — マウス軌跡, キーボード, 滞在時間
4. L4 Business: API Routes — 購入フロー制御, 在庫ロック
5. L5 Analytics: Dashboard — リアルタイム脅威可視化

## ディレクトリ構成
src/
├── middleware.ts
├── lib/
│   ├── i18n.ts              ← 翻訳辞書（ja/en）
│   ├── locale-context.tsx   ← LocaleProvider + useLocale Hook
│   ├── mock-products.ts     ← 商品データ（日英対応）
│   ├── bot-shield/
│   │   ├── config.ts
│   │   ├── scorer.ts
│   │   ├── rate-limiter.ts
│   │   └── types.ts
│   └── db/
│       ├── schema.sql
│       └── bot-events.ts
├── hooks/
│   └── use-bot-shield.ts
├── components/
│   ├── LanguageSwitcher.tsx  ← 言語切替ボタン
│   └── bot-shield/
│       ├── TurnstileWidget.tsx
│       ├── BotModeToggle.tsx
│       └── dashboard/
│           ├── BotDashboard.tsx
│           ├── RiskChart.tsx
│           ├── EventsTable.tsx
│           └── StatsCards.tsx
├── app/
│   ├── page.tsx
│   ├── products/[id]/page.tsx
│   ├── dashboard/page.tsx
│   └── api/
│       └── bot-shield/
│           ├── event/route.ts
│           ├── verify/route.ts
│           ├── purchase/route.ts
│           └── stats/route.ts

## スコアリングアルゴリズム
リスクスコア 0-100:
  0-39:  ALLOW     — 通常購入
  40-59: FLAG      — 購入可、管理者通知
  60-79: CHALLENGE — Turnstile強制
  80-100: BLOCK    — 購入ブロック

シグナル:
  BotD自動化ツール検出:    +50 (×1.0)
  Turnstile失敗:          +40 (×1.0)
  Rate Limit超過:         +35 (×0.9)
  マウス移動なし:          +30 (×0.8)
  同一IP短時間複数購入:    +30 (×0.8)
  ページ滞在 < 2秒:       +25 (×0.9)
  キーボードパターン異常:   +20 (×0.7)
  User-Agent異常:         +15 (×0.6)

## 多言語対応（i18n）
- 対応言語: 日本語（ja）、英語（en）
- 仕組み: React Context（LocaleProvider）+ useLocale Hook
- 翻訳辞書: src/lib/i18n.ts に全UIテキストを集約
- 言語切替: ヘッダー右上の EN/JA ボタン
- 永続化: localStorage（キー: bot-shield-locale）
- 初回アクセス: ブラウザ言語を自動検出（ja → 日本語、それ以外 → 英語）
- 商品データ: mock-products.ts 内で name/description/category を {ja, en} で管理
- 新規テキスト追加時: i18n.ts の ja/en 両方にキーを追加し、コンポーネントでは t('key') を使用

## コーディング規約
- 型安全を最優先。anyは使わない
- サーバーコンポーネントをデフォルトに。'use client'は必要な箇所のみ
- コメントはロジックが非自明な箇所のみ
- 1ファイル1責務
