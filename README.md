# 🛡️ BOT Shield

**Multi-layered bot defense system for e-commerce platforms.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Demo](https://img.shields.io/badge/Live_Demo-▶-00C853)](#demo)

> Protects limited-edition product drops from automated scalper bots by analyzing real-time user behavior — mouse movement entropy, keyboard timing variance, dwell time, and more.

---

## Screenshots

| Store Front | Product Detail | Dashboard (SOC) |
|:-----------:|:--------------:|:---------------:|
| ![Store](https://via.placeholder.com/400x250/030712/06b6d4?text=Store+Front) | ![Product](https://via.placeholder.com/400x250/030712/10b981?text=Product+Detail) | ![Dashboard](https://via.placeholder.com/400x250/030712/f59e0b?text=Dashboard) |

| BOT Mode OFF (Allowed) | BOT Mode ON (Blocked) |
|:-----------------------:|:---------------------:|
| ![Allowed](https://via.placeholder.com/400x200/030712/06b6d4?text=Score+24+→+ALLOW) | ![Blocked](https://via.placeholder.com/400x200/030712/ef4444?text=Score+94+→+BLOCK) |

---

## Architecture — 5-Layer Defense Model

```mermaid
graph TB
    Client([User / Bot])

    subgraph L1["L1 — Edge Layer"]
        MW[Next.js Middleware]
        RL[Rate Limiter<br/>Sliding Window]
        UA[User-Agent<br/>Analysis]
    end

    subgraph L2["L2 — Challenge Layer"]
        TS[Cloudflare Turnstile<br/>Invisible Mode]
        BD[BotD<br/>Automation Detection]
    end

    subgraph L3["L3 — Behavior Layer"]
        MO[Mouse Entropy<br/>Angle Variance]
        KB[Keyboard Timing<br/>CV Analysis]
        DW[Dwell Time<br/>Threshold Check]
        SC[Scroll & Click<br/>Pattern Capture]
    end

    subgraph L4["L4 — Business Layer"]
        SR[Scoring Engine<br/>0–100 Risk Score]
        PA[Purchase Guard<br/>Action Routing]
        IP[IP Blocklist<br/>TTL-based]
    end

    subgraph L5["L5 — Analytics Layer"]
        DB[(PostgreSQL)]
        DASH[SOC Dashboard<br/>Real-time Charts]
    end

    Client --> L1
    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5

    style L1 fill:#0f172a,stroke:#0ea5e9,color:#e2e8f0
    style L2 fill:#0f172a,stroke:#f59e0b,color:#e2e8f0
    style L3 fill:#0f172a,stroke:#10b981,color:#e2e8f0
    style L4 fill:#0f172a,stroke:#f97316,color:#e2e8f0
    style L5 fill:#0f172a,stroke:#ef4444,color:#e2e8f0
```

### Layer Details

| Layer | Component | Role |
|:-----:|-----------|------|
| **L1** | `middleware.ts` | Rate limiting (sliding window), suspicious UA detection, IP extraction |
| **L2** | `TurnstileWidget` | Cloudflare Turnstile (invisible), BotD automation detection |
| **L3** | `useBotShield()` | Mouse entropy, keyboard CV, dwell time, scroll depth, click patterns |
| **L4** | API Routes | Risk scoring, purchase flow guard, IP blocklist management |
| **L5** | Dashboard | Real-time threat visualization, event log, statistics |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL 14+ (optional — in-memory fallback for demo) |
| Challenge | Cloudflare Turnstile |
| Bot Detection | @fingerprintjs/botd, @fingerprintjs/fingerprintjs |
| Charts | Recharts 3 |
| Runtime | Node.js 20+ |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ *(optional — runs with in-memory store without it)*

### Installation

```bash
git clone https://github.com/your-username/bot-shield.git
cd bot-shield
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
# Database (optional — omit for in-memory demo mode)
DATABASE_URL=postgresql://user:password@localhost:5432/bot_shield

# Cloudflare Turnstile (optional — skipped if not set)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
TURNSTILE_SECRET_KEY=your_secret_key
```

### Database Setup (Optional)

```bash
psql $DATABASE_URL -f src/lib/db/schema.sql
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scoring Algorithm

Risk score ranges from **0 to 100**:

| Score | Level | Action | Description |
|:-----:|:-----:|:------:|-------------|
| 0–39 | `low` | **ALLOW** | Normal purchase |
| 40–59 | `medium` | **FLAG** | Purchase allowed, admin notified |
| 60–79 | `high` | **CHALLENGE** | Turnstile challenge forced |
| 80–100 | `critical` | **BLOCK** | Purchase blocked |

### Signal Weights

| Signal | Base Score | Multiplier | Effective |
|--------|:---------:|:----------:|:---------:|
| BotD automation detected | 50 | ×1.0 | **+50** |
| Turnstile failed | 40 | ×1.0 | **+40** |
| Rate limit exceeded | 35 | ×0.9 | **+32** |
| No mouse movement | 30 | ×0.8 | **+24** |
| Rapid purchases (same IP) | 30 | ×0.8 | **+24** |
| Short dwell time (< 2s) | 25 | ×0.9 | **+23** |
| Abnormal keyboard pattern | 20 | ×0.7 | **+14** |
| Suspicious User-Agent | 15 | ×0.6 | **+9** |

---

## Project Structure

```
src/
├── middleware.ts                          # L1: Rate limiting, UA detection
├── hooks/
│   └── use-bot-shield.ts                 # L3: Behavioral signal collector
├── lib/
│   ├── bot-shield/
│   │   ├── config.ts                     # Scoring weights & thresholds
│   │   ├── scorer.ts                     # Risk score calculator
│   │   ├── rate-limiter.ts               # Sliding window rate limiter
│   │   └── types.ts                      # Type definitions
│   ├── db/
│   │   ├── schema.sql                    # PostgreSQL schema
│   │   └── bot-events.ts                 # DB abstraction (PG + in-memory)
│   └── mock-products.ts                  # Demo product data
├── components/bot-shield/
│   ├── TurnstileWidget.tsx               # L2: Cloudflare Turnstile
│   ├── BotModeToggle.tsx                 # Interactive demo panel
│   └── dashboard/
│       ├── BotDashboard.tsx              # Dashboard orchestrator
│       ├── StatsCards.tsx                 # Metric cards
│       ├── RiskChart.tsx                 # AreaChart + PieChart
│       └── EventsTable.tsx              # Event log table
└── app/
    ├── page.tsx                          # Store front
    ├── products/[id]/page.tsx            # Product detail + purchase flow
    ├── dashboard/page.tsx                # SOC dashboard
    └── api/bot-shield/
        ├── event/route.ts                # Signal ingestion + scoring
        ├── verify/route.ts               # Turnstile verification
        ├── purchase/route.ts             # Purchase guard
        └── stats/route.ts                # Dashboard statistics
```

---

## Demo Flow

1. **Visit the store** — Browse products, bot shield monitors behavior in background
2. **Open floating panel** — See your real-time risk score (should be LOW / ALLOW)
3. **Purchase a product** — Goes through successfully
4. **Toggle BOT Mode ON** — Score jumps to ~94, all signal bars turn red
5. **Try purchasing again** — **BLOCKED** — risk card shows score breakdown
6. **Visit Dashboard** — See aggregated threat data, charts, and event log

---

## 日本語セクション

### 概要

BOT Shield は EC サイトの限定商品販売における転売BOT問題を解決する多層防御システムです。

### 主な機能

- **リアルタイム行動分析**: マウス軌跡のエントロピー、キーボード入力間隔の変動係数、ページ滞在時間を統合的にスコアリング
- **5層防御**: Edge → Challenge → Behavior → Business → Analytics の多段階で防御
- **デモモード**: BOT Mode トグルで即座にシステムの防御効果を体験可能
- **SOCダッシュボード**: セキュリティオペレーションセンター風の脅威可視化

### スコアリング

リスクスコア 0〜100 を算出し、4段階のアクションに分岐:

| スコア | レベル | アクション |
|:------:|:------:|:----------:|
| 0–39 | 低 | 通常購入 |
| 40–59 | 中 | 購入可 + 管理者通知 |
| 60–79 | 高 | Turnstile チャレンジ強制 |
| 80–100 | 危険 | 購入ブロック |

---

## License

[MIT](./LICENSE)
