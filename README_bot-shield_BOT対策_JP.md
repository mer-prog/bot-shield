# BOT Shield — EC向け多層BOT対策システム

## 習得スキル・学習キーワード

Next.js 16 (App Router) / TypeScript / Tailwind CSS 4 / PostgreSQL / Cloudflare Turnstile / Recharts 3 / リアルタイム行動分析 / マウスエントロピー解析 / キーボードタイミング変動係数 / Sliding Window Rate Limiting / 5層防御アーキテクチャ / リスクスコアリングエンジン / SOCダッシュボード / Edge Middleware / IPブロックリスト（TTL対応）/ インメモリフォールバック / React Hooks設計パターン / Server Components / Client Components / JSONB GINインデックス

---

## 技術スタック

| カテゴリ | 技術 | バージョン |
|:---------|:-----|:-----------|
| フレームワーク | Next.js (App Router) | 16.1.6 |
| 言語 | TypeScript | ^5 |
| UI | React | 19.2.3 |
| スタイリング | Tailwind CSS | ^4 |
| データベース | PostgreSQL（省略可：インメモリフォールバック対応） | 14+ |
| チャレンジ認証 | Cloudflare Turnstile | — |
| BOT検出 | @fingerprintjs/botd | ^2.0.0 |
| ブラウザ識別 | @fingerprintjs/fingerprintjs | ^5.1.0 |
| チャート | Recharts | ^3.7.0 |
| DBクライアント | pg (node-postgres) | ^8.19.0 |
| ランタイム | Node.js | 20+ |

---

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────────┐
│                         クライアント (ブラウザ)                        │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────────────┐  │
│  │ useBotShield │  │ TurnstileWidget│  │ BotModeToggle          │  │
│  │  マウス軌跡   │  │  Invisible Mode│  │  デモ用リスク可視化     │  │
│  │  キーボード   │  │                │  │  シグナル分析表示       │  │
│  │  スクロール   │  │                │  │                        │  │
│  │  クリック     │  │                │  │                        │  │
│  │  滞在時間     │  │                │  │                        │  │
│  └──────┬───────┘  └───────┬────────┘  └────────────────────────┘  │
│         │                  │                                        │
└─────────┼──────────────────┼────────────────────────────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ L1 — Edge Layer (middleware.ts)                                     │
│  ┌──────────────────┐  ┌────────────────────────────────────────┐  │
│  │ Rate Limiter      │  │ User-Agent 検証                        │  │
│  │ Sliding Window    │  │ Headless/BOT/Crawler パターン検出       │  │
│  │ IP単位 30req/60s  │  │ → X-Bot-Shield-Suspicious-UA ヘッダ   │  │
│  └──────────────────┘  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ L2 — Challenge Layer                                                │
│  ┌──────────────────┐  ┌──────────────────┐                        │
│  │ Cloudflare        │  │ BotD             │                        │
│  │ Turnstile         │  │ 自動化ツール検出  │                        │
│  │ (Invisible Mode)  │  │                  │                        │
│  └──────────────────┘  └──────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ L3 — Behavior Layer (useBotShield Hook)                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │マウス     │ │キーボード│ │滞在時間  │ │スクロール│ │クリック  │ │
│  │エントロピ │ │CV分析    │ │閾値判定  │ │深度追跡  │ │パターン  │ │
│  │角度分散   │ │間隔変動  │ │< 2秒検出 │ │          │ │座標記録  │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ L4 — Business Layer (API Routes)                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ Scoring Engine    │  │ Purchase Guard   │  │ IP Blocklist     │  │
│  │ 0–100 リスクスコア│  │ 4段階アクション   │  │ TTL対応          │  │
│  │ 8シグナル重み付き │  │ 分岐ルーティング  │  │ 自動追加(1h)     │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ L5 — Analytics Layer                                                │
│  ┌──────────────────┐  ┌──────────────────────────────────────────┐│
│  │ PostgreSQL        │  │ SOCダッシュボード                        ││
│  │ (インメモリ代替可)│  │ 時系列チャート / 円グラフ / イベントログ ││
│  │                   │  │ 30秒自動更新 / 時間範囲切替             ││
│  └──────────────────┘  └──────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## 機能一覧

### コア機能

1. **リアルタイム行動分析フック (`useBotShield`)**
   - マウス移動エントロピー解析（連続ベクトル間の角度変化分散）
   - キーボード入力タイミング分析（変動係数 CV < 0.1 で異常判定）
   - ページ滞在時間監視（2秒未満でフラグ）
   - スクロール深度追跡（ドキュメント高さに対する割合）
   - クリックパターン記録（座標ベースの履歴）
   - メモリ制限付きデータ収集（マウス200点、キー100点、クリック50点）
   - 1秒間隔の定期解析による`useState`更新

2. **5層防御モデル**
   - L1 Edge: Next.js Middleware によるRate Limiting + UA検証
   - L2 Challenge: Cloudflare Turnstile (Invisible) + BotD自動化検出
   - L3 Behavior: React Hook による行動シグナル収集・解析
   - L4 Business: リスクスコアリング + 購入フロー制御
   - L5 Analytics: SOCダッシュボードによるリアルタイム可視化

3. **リスクスコアリングエンジン**
   - 8種類のブールシグナルに対する重み付きスコア算出
   - スコア範囲: 0〜100（合計値をクランプ）
   - 4段階のリスクレベルとアクション自動判定

4. **購入フロー制御**
   - IPブロックリスト照合（TTL対応、期限切れ自動無効化）
   - 同一IP短時間複数購入検出（60秒ウィンドウ内3回超過で検出）
   - サーバーサイドUA異常シグナル注入
   - アクション分岐: ALLOW → FLAG → CHALLENGE → BLOCK

5. **SOCダッシュボード**
   - 統計カード4種（総イベント数、ブロック数、ブロック率、平均スコア）
   - 時系列AreaChart（アクション別積み上げ）
   - リスク分布PieChart（レベル別円グラフ）
   - イベントログテーブル（スコアバー付き、レベル・アクション色分け）
   - 時間範囲セレクタ（1H / 24H / 7D / 30D）
   - 30秒間隔の自動データ更新

6. **デモ体験機能 (`BotModeToggle`)**
   - フローティングパネル形式のリスク可視化ウィジェット
   - BOT Modeトグルによるスコア即時切替（通常 → 約94点）
   - SVG円形ゲージによるリスクスコア表示
   - 8シグナル分析バーのリアルタイム表示
   - アクションバナー（ALLOW / FLAG / CHALLENGE / BLOCK）
   - 親コンポーネントとのHookインスタンス共有機能

### サブ機能

- Sliding Window Rate Limiter（IP単位、5分間隔メモリクリーンアップ）
- Turnstileサーバーサイドトークン検証
- PostgreSQL未接続時のインメモリフォールバック
- ダッシュボード用モックデータ自動生成（DB未接続時）
- デモ用商品データ（日本市場向け限定商品5種）

---

## スコアリングアルゴリズム

### リスクスコアとアクション対応

| スコア | レベル | アクション | 動作 |
|:------:|:------:|:----------:|:-----|
| 0–39 | low | ALLOW | 通常購入を許可 |
| 40–59 | medium | FLAG | 購入許可、管理者に通知 |
| 60–79 | high | CHALLENGE | Turnstileチャレンジを強制 |
| 80–100 | critical | BLOCK | 購入をブロック |

### シグナル重み設定

| シグナル | 基本スコア | 乗数 | 実効スコア |
|:---------|:---------:|:----:|:---------:|
| BotD自動化ツール検出 | 50 | ×1.0 | **+50** |
| Turnstile失敗 | 40 | ×1.0 | **+40** |
| Rate Limit超過 | 35 | ×0.9 | **+32** |
| マウス移動なし | 30 | ×0.8 | **+24** |
| 同一IP短時間複数購入 | 30 | ×0.8 | **+24** |
| ページ滞在時間不足 (< 2秒) | 25 | ×0.9 | **+23** |
| キーボードパターン異常 | 20 | ×0.7 | **+14** |
| User-Agent異常 | 15 | ×0.6 | **+9** |

---

## ディレクトリ構成

```
bot-shield/
├── src/
│   ├── middleware.ts                           # L1: Rate Limiting, UA検出
│   ├── hooks/
│   │   └── use-bot-shield.ts                  # L3: 行動シグナル収集Hook (317行)
│   ├── lib/
│   │   ├── bot-shield/
│   │   │   ├── types.ts                       # 型定義 (89行)
│   │   │   ├── config.ts                      # スコアリング設定 (31行)
│   │   │   ├── scorer.ts                      # リスクスコア算出 (76行)
│   │   │   └── rate-limiter.ts                # Sliding Window Rate Limiter (71行)
│   │   ├── db/
│   │   │   ├── schema.sql                     # PostgreSQLスキーマ (91行)
│   │   │   └── bot-events.ts                  # DB抽象化層 (417行)
│   │   └── mock-products.ts                   # デモ商品データ (78行)
│   ├── components/
│   │   └── bot-shield/
│   │       ├── TurnstileWidget.tsx             # L2: Turnstile (122行)
│   │       ├── BotModeToggle.tsx               # デモパネル (318行)
│   │       └── dashboard/
│   │           ├── BotDashboard.tsx            # ダッシュボード統括 (154行)
│   │           ├── StatsCards.tsx              # 統計カード (87行)
│   │           ├── RiskChart.tsx               # 時系列+円グラフ (276行)
│   │           └── EventsTable.tsx            # イベントログ (154行)
│   └── app/
│       ├── globals.css                         # ダークテーマ / アニメーション (80行)
│       ├── layout.tsx                          # ルートレイアウト (21行)
│       ├── page.tsx                            # ストアトップページ (152行)
│       ├── products/[id]/page.tsx              # 商品詳細+購入フロー (363行)
│       ├── dashboard/page.tsx                  # ダッシュボードページ (41行)
│       └── api/bot-shield/
│           ├── event/route.ts                  # シグナル受信+スコアリング (100行)
│           ├── verify/route.ts                 # Turnstile検証 (84行)
│           ├── purchase/route.ts               # 購入ガード (201行)
│           └── stats/route.ts                  # ダッシュボード統計 (211行)
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── README.md
```

---

## セットアップ手順

### 前提条件

- Node.js 20以上
- PostgreSQL 14以上（省略可：インメモリモードで動作）

### インストール

```bash
git clone https://github.com/your-username/bot-shield.git
cd bot-shield
npm install
```

### 環境変数

`.env.local` を作成:

```env
# データベース（省略するとインメモリモードで動作）
DATABASE_URL=postgresql://user:password@localhost:5432/bot_shield

# Cloudflare Turnstile（省略するとTurnstileをスキップ）
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
TURNSTILE_SECRET_KEY=your_secret_key
```

### データベースセットアップ（PostgreSQL使用時のみ）

```bash
psql $DATABASE_URL -f src/lib/db/schema.sql
```

### 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス可能。

### ビルド

```bash
npm run build
npm start
```

---

## APIエンドポイント

### POST `/api/bot-shield/event`

行動シグナルを受信し、スコアリングしてDBに記録する。

| パラメータ | 型 | 必須 | 説明 |
|:-----------|:---|:----:|:-----|
| signals | BotSignals | ○ | 8種のブールシグナル |
| path | string | ○ | 検出対象のパス |
| sessionId | string | — | セッションID（省略時は自動生成） |
| fingerprintId | string | — | ブラウザフィンガープリントID |
| turnstileToken | string | — | Turnstileトークン |

**レスポンス:**

```json
{
  "event_id": "uuid",
  "risk_score": 24,
  "risk_level": "low",
  "action": "allow"
}
```

### POST `/api/bot-shield/purchase`

購入リクエストを処理し、リスクスコアに基づくアクション分岐を実行する。

| パラメータ | 型 | 必須 | 説明 |
|:-----------|:---|:----:|:-----|
| productId | string | ○ | 商品ID |
| quantity | number | — | 数量（デフォルト: 1） |
| signals | BotSignals | ○ | 行動シグナル |
| turnstileToken | string | — | Turnstileトークン |

**処理フロー:**
1. IPブロックリスト照合 → ブロック済みなら即座に403返却
2. 同一IP短時間複数購入チェック（60秒ウィンドウ内3回超過で`rapidPurchases`をON）
3. サーバーサイドUA異常シグナル注入
4. スコアリング → アクション分岐
5. BLOCK時かつ連続購入検出時 → IPを1時間ブロックリストに自動追加

### POST `/api/bot-shield/verify`

Cloudflare Turnstileトークンをサーバーサイドで検証する。

| パラメータ | 型 | 必須 | 説明 |
|:-----------|:---|:----:|:-----|
| token | string | ○ | Turnstileトークン |

### GET `/api/bot-shield/stats`

ダッシュボード用の統計データを取得する。

| クエリパラメータ | 型 | デフォルト | 説明 |
|:-----------------|:---|:-----------|:-----|
| range | string | 24h | 集計範囲（1h / 24h / 7d / 30d） |

**レスポンス:** 統計サマリー、時系列データ、ブロック率、リスク上位IP、直近イベント一覧。DB未接続かつイベント0件時はモックデータを返却。

---

## DB設計

### テーブル一覧

| テーブル | 説明 |
|:---------|:-----|
| `bot_events` | BOT検出イベントの全記録 |
| `purchase_attempts` | 購入試行の記録（`bot_events`と外部キー連携） |
| `ip_blocklist` | IPブロックリスト（TTL対応、期限切れ自動無効化） |
| `bot_shield_config` | システム設定（key-value形式、JSONB値） |

### `bot_events` テーブル

| カラム | 型 | 説明 |
|:-------|:---|:-----|
| id | UUID (PK) | 自動生成 |
| session_id | VARCHAR(255) | セッション識別子 |
| ip_address | INET | クライアントIP |
| user_agent | TEXT | User-Agent文字列 |
| path | VARCHAR(1024) | 検出対象パス |
| signals | JSONB | 8種の行動シグナル |
| risk_score | SMALLINT | リスクスコア (0–100) |
| risk_level | VARCHAR(20) | low / medium / high / critical |
| action | VARCHAR(20) | allow / flag / challenge / block |
| fingerprint_id | VARCHAR(255) | ブラウザフィンガープリントID |
| turnstile_token | TEXT | Turnstileトークン |
| created_at | TIMESTAMPTZ | 記録日時 |

### インデックス設計

- `bot_events`: `created_at DESC`, `ip_address`, `session_id`, `risk_level`, `action`, JSONB GINインデックス（`signals`）
- `purchase_attempts`: `bot_event_id`, `ip_address`, `created_at DESC`, `status`
- `ip_blocklist`: `ip_address` (UNIQUE), `expires_at`（部分インデックス: NULLでないもの）

### デュアルモードDB抽象化

`bot-events.ts` はPostgreSQLとインメモリストアの両方に対応するDB抽象化層。`DATABASE_URL` 環境変数の有無で自動切替。`pg` モジュールはdynamic importで読み込むため、未インストールでもビルドエラーにならない。

---

## セキュリティ設計

### Rate Limiting

- Sliding Window方式（IP単位）
- デフォルト: 30リクエスト/60秒
- 5分間隔でメモリクリーンアップ
- 超過時は HTTP 429 + `Retry-After` ヘッダ返却

### User-Agent検証

Middleware で以下のパターンを検出:
`headless`, `bot`, `crawler`, `spider`, `scraper`, `curl`, `wget`, `python-`, `httpx`, `puppeteer`, `playwright`, `selenium`, `phantomjs`

検出時は `X-Bot-Shield-Suspicious-UA: true` ヘッダを設定し、後段のAPI Routeがサーバーサイドシグナルとして注入。

### IPブロックリスト

- TTL対応（期限切れエントリは自動無効化）
- 購入ブロック + 連続購入検出時に自動追加（TTL: 1時間）
- PostgreSQL使用時は `UPSERT` で重複IP対応

### Turnstile検証

- Invisible Modeで自動実行
- サーバーサイドで Cloudflare siteverify API に検証リクエスト
- 環境変数未設定時はスキップ（デモモード対応）

---

## 設計上の工夫

### Hookインスタンス共有パターン

`BotModeToggle` は `botShield?: UseBotShieldReturn` をpropsで受け取る設計。商品詳細ページでは親コンポーネントの `useBotShield()` インスタンスを渡すことで、購入フローとデモパネルが同一のシグナル・スコアを参照する。トップページなど共有が不要な場合は内部で独自インスタンスを生成する。

### useRefによる高頻度イベント処理

`useBotShield` Hook は `mousemove` (50ms throttle)、`keydown`、`scroll` (100ms throttle)、`click` の4種イベントを監視するが、全てのデータを `useRef` に格納し、1秒間隔の `setInterval` で `useState` を更新する。これにより高頻度イベントが再レンダリングを発生させない。

### メモリ境界付きデータ収集

長時間セッションでのメモリ増大を防ぐため、各データ配列に上限を設定:
- マウスポイント: 200点
- キー入力間隔: 100点
- クリック座標: 50点

上限到達時は `.shift()` で古いデータから破棄する。

### サーバーサイドシグナル注入

クライアントから送信されたシグナルに対し、Middlewareが設定したヘッダ情報（`X-Bot-Shield-Suspicious-UA`）をAPI Route側で上書き注入する。これによりクライアント側でのシグナル偽装を防止。

### モックデータ自動生成

ダッシュボード統計API (`/api/bot-shield/stats`) は、DB未接続かつイベント0件の場合にリアルなモックデータ（24時間分の時系列 + 20件のイベント）を自動生成する。これによりDBなしでもダッシュボードのデモが可能。

---

## デモフロー

1. **ストアを開く** — 商品一覧を閲覧。バックグラウンドで行動分析が稼働
2. **フローティングパネルを開く** — リアルタイムのリスクスコアを確認（通常は LOW / ALLOW）
3. **商品を購入する** — 正常に購入完了
4. **BOT Modeをオンにする** — スコアが約94に急上昇、全シグナルバーが赤色に変化
5. **再度購入を試みる** — **BLOCK** — スコア内訳とリスクカードが表示される
6. **ダッシュボードを開く** — 集計された脅威データ、チャート、イベントログを確認

---

## ランニングコスト

| リソース | 費用 |
|:---------|:-----|
| Cloudflare Turnstile | 無料（Freeプラン） |
| PostgreSQL | セルフホスト時は無料 / マネージド利用時はプロバイダ依存 |
| Vercel (Next.js デプロイ) | 無料枠あり（Hobbyプラン） |
| @fingerprintjs/botd | 無料（OSSライブラリ） |

> インメモリモード + Turnstileスキップで動作する構成では外部サービス費用は発生しない。

---

## 作者

ポートフォリオプロジェクト — ECサイト向け多層BOT対策システム
