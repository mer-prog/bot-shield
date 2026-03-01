# BOT Shield — Multi-Layer Bot Defense System for E-Commerce

## Skills & Keywords

Next.js 16 (App Router) / TypeScript / Tailwind CSS 4 / PostgreSQL / Cloudflare Turnstile / Recharts 3 / Real-Time Behavioral Analysis / Mouse Movement Entropy / Keyboard Timing Coefficient of Variation / Sliding Window Rate Limiting / 5-Layer Defense Architecture / Risk Scoring Engine / SOC Dashboard / Edge Middleware / IP Blocklist (TTL-Based) / In-Memory Fallback / React Hooks Design Pattern / Server Components / Client Components / JSONB GIN Index

---

## Tech Stack

| Category | Technology | Version |
|:---------|:-----------|:--------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | ^5 |
| UI | React | 19.2.3 |
| Styling | Tailwind CSS | ^4 |
| Database | PostgreSQL (optional — in-memory fallback available) | 14+ |
| Challenge | Cloudflare Turnstile | — |
| Bot Detection | @fingerprintjs/botd | ^2.0.0 |
| Browser Fingerprinting | @fingerprintjs/fingerprintjs | ^5.1.0 |
| Charts | Recharts | ^3.7.0 |
| DB Client | pg (node-postgres) | ^8.19.0 |
| Runtime | Node.js | 20+ |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                            │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────────────┐  │
│  │ useBotShield │  │ TurnstileWidget│  │ BotModeToggle          │  │
│  │  Mouse trail  │  │  Invisible Mode│  │  Demo risk visualizer  │  │
│  │  Keyboard     │  │                │  │  Signal analysis bars  │  │
│  │  Scroll       │  │                │  │                        │  │
│  │  Click        │  │                │  │                        │  │
│  │  Dwell time   │  │                │  │                        │  │
│  └──────┬───────┘  └───────┬────────┘  └────────────────────────┘  │
│         │                  │                                        │
└─────────┼──────────────────┼────────────────────────────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ L1 — Edge Layer (middleware.ts)                                     │
│  ┌──────────────────┐  ┌────────────────────────────────────────┐  │
│  │ Rate Limiter      │  │ User-Agent Validation                  │  │
│  │ Sliding Window    │  │ Headless/Bot/Crawler pattern detection │  │
│  │ Per-IP 30req/60s  │  │ → X-Bot-Shield-Suspicious-UA header   │  │
│  └──────────────────┘  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ L2 — Challenge Layer                                                │
│  ┌──────────────────┐  ┌──────────────────┐                        │
│  │ Cloudflare        │  │ BotD             │                        │
│  │ Turnstile         │  │ Automation       │                        │
│  │ (Invisible Mode)  │  │ Detection        │                        │
│  └──────────────────┘  └──────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ L3 — Behavior Layer (useBotShield Hook)                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Mouse    │ │ Keyboard │ │ Dwell    │ │ Scroll   │ │ Click    │ │
│  │ Entropy  │ │ CV       │ │ Time     │ │ Depth    │ │ Pattern  │ │
│  │ Angle    │ │ Interval │ │ Threshold│ │ Tracking │ │ Coords   │ │
│  │ Variance │ │ Variance │ │ < 2s     │ │          │ │ History  │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ L4 — Business Layer (API Routes)                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ Scoring Engine    │  │ Purchase Guard   │  │ IP Blocklist     │  │
│  │ 0–100 Risk Score  │  │ 4-Tier Action    │  │ TTL-Based        │  │
│  │ 8 Weighted Signal │  │ Routing          │  │ Auto-Add (1h)    │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ L5 — Analytics Layer                                                │
│  ┌──────────────────┐  ┌──────────────────────────────────────────┐│
│  │ PostgreSQL        │  │ SOC Dashboard                            ││
│  │ (In-Memory Alt.)  │  │ Time-series Chart / Pie Chart / Events  ││
│  │                   │  │ 30s Auto-Refresh / Time Range Selector   ││
│  └──────────────────┘  └──────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Features

### Core Features

1. **Real-Time Behavioral Analysis Hook (`useBotShield`)**
   - Mouse movement entropy analysis (angle-change variance between consecutive vectors)
   - Keyboard timing analysis (coefficient of variation; CV < 0.1 flagged as abnormal)
   - Page dwell time monitoring (flagged when below 2 seconds)
   - Scroll depth tracking (percentage of document height)
   - Click pattern recording (coordinate-based history)
   - Memory-bounded data collection (mouse: 200 points, key: 100 intervals, click: 50 points)
   - Periodic analysis at 1-second intervals via `useState` updates

2. **5-Layer Defense Model**
   - L1 Edge: Next.js Middleware for rate limiting and UA validation
   - L2 Challenge: Cloudflare Turnstile (invisible) and BotD automation detection
   - L3 Behavior: React Hook for behavioral signal collection and analysis
   - L4 Business: Risk scoring and purchase flow control
   - L5 Analytics: SOC dashboard with real-time threat visualization

3. **Risk Scoring Engine**
   - Weighted scoring across 8 boolean signals
   - Score range: 0 to 100 (clamped)
   - Automatic risk level and action determination in 4 tiers

4. **Purchase Flow Control**
   - IP blocklist lookup (TTL-based with automatic expiration)
   - Rapid purchase detection from same IP (triggers when exceeding 3 purchases within a 60-second window)
   - Server-side UA anomaly signal injection
   - Action routing: ALLOW → FLAG → CHALLENGE → BLOCK

5. **SOC Dashboard**
   - 4 stat cards (total events, blocked count, block rate, average score)
   - Time-series AreaChart (stacked by action type)
   - Risk distribution PieChart (grouped by risk level)
   - Event log table (inline score bars with color-coded level and action badges)
   - Time range selector (1H / 24H / 7D / 30D)
   - Auto-refresh every 30 seconds

6. **Demo Experience (`BotModeToggle`)**
   - Floating panel widget for risk visualization
   - BOT Mode toggle for instant score switching (normal → ~94 points)
   - SVG circular gauge for risk score display
   - Real-time display of 8 signal analysis bars
   - Action banner (ALLOW / FLAG / CHALLENGE / BLOCK)
   - Shared hook instance support with parent components

### Supporting Features

- Sliding window rate limiter (per-IP, with 5-minute memory cleanup)
- Server-side Turnstile token verification
- In-memory fallback when PostgreSQL is unavailable
- Automatic mock data generation for the dashboard (when DB is disconnected)
- Demo product catalog (5 limited-edition products targeting the Japanese market)

---

## Scoring Algorithm

### Risk Score to Action Mapping

| Score | Level | Action | Behavior |
|:-----:|:-----:|:------:|:---------|
| 0–39 | low | ALLOW | Normal purchase permitted |
| 40–59 | medium | FLAG | Purchase permitted with admin notification |
| 60–79 | high | CHALLENGE | Turnstile challenge enforced |
| 80–100 | critical | BLOCK | Purchase blocked |

### Signal Weights

| Signal | Base Score | Multiplier | Effective Score |
|:-------|:---------:|:----------:|:--------------:|
| BotD automation detected | 50 | ×1.0 | **+50** |
| Turnstile failed | 40 | ×1.0 | **+40** |
| Rate limit exceeded | 35 | ×0.9 | **+32** |
| No mouse movement | 30 | ×0.8 | **+24** |
| Rapid purchases (same IP) | 30 | ×0.8 | **+24** |
| Short dwell time (< 2s) | 25 | ×0.9 | **+23** |
| Abnormal keyboard pattern | 20 | ×0.7 | **+14** |
| Suspicious User-Agent | 15 | ×0.6 | **+9** |

---

## Directory Structure

```
bot-shield/
├── src/
│   ├── middleware.ts                           # L1: Rate limiting, UA detection
│   ├── hooks/
│   │   └── use-bot-shield.ts                  # L3: Behavioral signal collector (317 lines)
│   ├── lib/
│   │   ├── bot-shield/
│   │   │   ├── types.ts                       # Type definitions (89 lines)
│   │   │   ├── config.ts                      # Scoring configuration (31 lines)
│   │   │   ├── scorer.ts                      # Risk score calculator (76 lines)
│   │   │   └── rate-limiter.ts                # Sliding window rate limiter (71 lines)
│   │   ├── db/
│   │   │   ├── schema.sql                     # PostgreSQL schema (91 lines)
│   │   │   └── bot-events.ts                  # DB abstraction layer (417 lines)
│   │   └── mock-products.ts                   # Demo product data (78 lines)
│   ├── components/
│   │   └── bot-shield/
│   │       ├── TurnstileWidget.tsx             # L2: Turnstile widget (122 lines)
│   │       ├── BotModeToggle.tsx               # Demo panel (318 lines)
│   │       └── dashboard/
│   │           ├── BotDashboard.tsx            # Dashboard orchestrator (154 lines)
│   │           ├── StatsCards.tsx              # Stat cards (87 lines)
│   │           ├── RiskChart.tsx               # Time-series + pie chart (276 lines)
│   │           └── EventsTable.tsx            # Event log table (154 lines)
│   └── app/
│       ├── globals.css                         # Dark theme / animations (80 lines)
│       ├── layout.tsx                          # Root layout (21 lines)
│       ├── page.tsx                            # Store front page (152 lines)
│       ├── products/[id]/page.tsx              # Product detail + purchase flow (363 lines)
│       ├── dashboard/page.tsx                  # Dashboard page (41 lines)
│       └── api/bot-shield/
│           ├── event/route.ts                  # Signal ingestion + scoring (100 lines)
│           ├── verify/route.ts                 # Turnstile verification (84 lines)
│           ├── purchase/route.ts               # Purchase guard (201 lines)
│           └── stats/route.ts                  # Dashboard statistics (211 lines)
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── README.md
```

---

## Setup

### Prerequisites

- Node.js 20 or later
- PostgreSQL 14 or later (optional — runs with in-memory store without it)

### Installation

```bash
git clone https://github.com/your-username/bot-shield.git
cd bot-shield
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
# Database (omit for in-memory demo mode)
DATABASE_URL=postgresql://user:password@localhost:5432/bot_shield

# Cloudflare Turnstile (omit to skip Turnstile)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
TURNSTILE_SECRET_KEY=your_secret_key
```

### Database Setup (PostgreSQL only)

```bash
psql $DATABASE_URL -f src/lib/db/schema.sql
```

### Development Server

```bash
npm run dev
```

Access at http://localhost:3000.

### Production Build

```bash
npm run build
npm start
```

---

## API Endpoints

### POST `/api/bot-shield/event`

Receives behavioral signals, performs risk scoring, and records the event to the database.

| Parameter | Type | Required | Description |
|:----------|:-----|:--------:|:------------|
| signals | BotSignals | Yes | 8 boolean behavioral signals |
| path | string | Yes | Target path for detection |
| sessionId | string | No | Session ID (auto-generated if omitted) |
| fingerprintId | string | No | Browser fingerprint ID |
| turnstileToken | string | No | Turnstile token |

**Response:**

```json
{
  "event_id": "uuid",
  "risk_score": 24,
  "risk_level": "low",
  "action": "allow"
}
```

### POST `/api/bot-shield/purchase`

Processes a purchase request and routes the action based on the risk score.

| Parameter | Type | Required | Description |
|:----------|:-----|:--------:|:------------|
| productId | string | Yes | Product ID |
| quantity | number | No | Quantity (default: 1) |
| signals | BotSignals | Yes | Behavioral signals |
| turnstileToken | string | No | Turnstile token |

**Processing Flow:**
1. IP blocklist lookup — returns 403 immediately if blocked
2. Rapid purchase check from same IP (flags `rapidPurchases` when exceeding 3 purchases within 60 seconds)
3. Server-side UA anomaly signal injection
4. Scoring and action routing
5. On BLOCK with rapid purchase detection — auto-adds IP to blocklist for 1 hour

### POST `/api/bot-shield/verify`

Server-side verification of a Cloudflare Turnstile token.

| Parameter | Type | Required | Description |
|:----------|:-----|:--------:|:------------|
| token | string | Yes | Turnstile token |

### GET `/api/bot-shield/stats`

Retrieves statistics data for the dashboard.

| Query Parameter | Type | Default | Description |
|:----------------|:-----|:--------|:------------|
| range | string | 24h | Aggregation range (1h / 24h / 7d / 30d) |

**Response:** Statistics summary, time-series data, block rate, top risk IPs, and recent events. Returns mock data when the database is disconnected and no events exist.

---

## Database Design

### Tables

| Table | Description |
|:------|:------------|
| `bot_events` | Complete record of all bot detection events |
| `purchase_attempts` | Purchase attempt records (foreign key to `bot_events`) |
| `ip_blocklist` | IP blocklist with TTL support (expired entries auto-invalidated) |
| `bot_shield_config` | System configuration (key-value format with JSONB values) |

### `bot_events` Table

| Column | Type | Description |
|:-------|:-----|:------------|
| id | UUID (PK) | Auto-generated |
| session_id | VARCHAR(255) | Session identifier |
| ip_address | INET | Client IP address |
| user_agent | TEXT | User-Agent string |
| path | VARCHAR(1024) | Detection target path |
| signals | JSONB | 8 behavioral signals |
| risk_score | SMALLINT | Risk score (0–100) |
| risk_level | VARCHAR(20) | low / medium / high / critical |
| action | VARCHAR(20) | allow / flag / challenge / block |
| fingerprint_id | VARCHAR(255) | Browser fingerprint ID |
| turnstile_token | TEXT | Turnstile token |
| created_at | TIMESTAMPTZ | Timestamp |

### Index Design

- `bot_events`: `created_at DESC`, `ip_address`, `session_id`, `risk_level`, `action`, JSONB GIN index on `signals`
- `purchase_attempts`: `bot_event_id`, `ip_address`, `created_at DESC`, `status`
- `ip_blocklist`: `ip_address` (UNIQUE), `expires_at` (partial index on non-NULL values)

### Dual-Mode Database Abstraction

The `bot-events.ts` module provides a database abstraction layer supporting both PostgreSQL and an in-memory store. It automatically switches based on the presence of the `DATABASE_URL` environment variable. The `pg` module is loaded via dynamic import, so the application builds without errors even when `pg` is not installed.

---

## Security Design

### Rate Limiting

- Sliding window algorithm (per-IP)
- Default: 30 requests per 60 seconds
- Memory cleanup at 5-minute intervals
- Returns HTTP 429 with `Retry-After` header on limit exceeded

### User-Agent Validation

The middleware detects the following patterns:
`headless`, `bot`, `crawler`, `spider`, `scraper`, `curl`, `wget`, `python-`, `httpx`, `puppeteer`, `playwright`, `selenium`, `phantomjs`

On detection, the `X-Bot-Shield-Suspicious-UA: true` header is set, and downstream API routes inject it as a server-side signal.

### IP Blocklist

- TTL-based (expired entries are automatically invalidated)
- Auto-added on purchase block combined with rapid purchase detection (TTL: 1 hour)
- Uses `UPSERT` for duplicate IP handling when PostgreSQL is available

### Turnstile Verification

- Runs in invisible mode for seamless user experience
- Server-side verification via the Cloudflare siteverify API
- Gracefully skipped when environment variables are not configured (demo mode)

---

## Design Decisions

### Shared Hook Instance Pattern

`BotModeToggle` accepts an optional `botShield?: UseBotShieldReturn` prop. On the product detail page, the parent component passes its `useBotShield()` instance so that the purchase flow and the demo panel share the same signals and score. On the store front page where sharing is not needed, the component creates its own internal instance.

### useRef for High-Frequency Event Processing

The `useBotShield` hook monitors 4 event types — `mousemove` (50ms throttle), `keydown`, `scroll` (100ms throttle), and `click` — but stores all data in `useRef`. State is updated via `useState` only during the 1-second `setInterval` analysis cycle. This prevents high-frequency events from triggering unnecessary re-renders.

### Memory-Bounded Data Collection

To prevent memory growth during long sessions, each data array has a cap:
- Mouse points: 200
- Key intervals: 100
- Click coordinates: 50

When the cap is reached, the oldest entries are removed using `.shift()`.

### Server-Side Signal Injection

Client-submitted signals are augmented with server-side information. The middleware sets header flags (e.g., `X-Bot-Shield-Suspicious-UA`), and API routes inject these as override signals. This prevents client-side signal spoofing.

### Automatic Mock Data Generation

The dashboard statistics API (`/api/bot-shield/stats`) automatically generates realistic mock data (24-hour time series and 20 events) when the database is disconnected and no events exist. This enables a fully functional dashboard demo without a database.

---

## Demo Flow

1. **Visit the store** — Browse the product catalog. Behavioral analysis runs in the background.
2. **Open the floating panel** — View your real-time risk score (should show LOW / ALLOW).
3. **Purchase a product** — The purchase completes successfully.
4. **Toggle BOT Mode ON** — The score jumps to approximately 94. All signal bars turn red.
5. **Attempt another purchase** — **BLOCKED** — A risk card with score breakdown is displayed.
6. **Visit the Dashboard** — View aggregated threat data, charts, and the event log.

---

## Running Costs

| Resource | Cost |
|:---------|:-----|
| Cloudflare Turnstile | Free (Free tier) |
| PostgreSQL | Free when self-hosted / provider-dependent for managed services |
| Vercel (Next.js deployment) | Free tier available (Hobby plan) |
| @fingerprintjs/botd | Free (open-source library) |

> When running in in-memory mode with Turnstile skipped, no external service costs are incurred.

---

## Author

Portfolio project — Multi-layer bot defense system for e-commerce platforms.
