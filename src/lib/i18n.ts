export type Locale = 'ja' | 'en';

const translations = {
  ja: {
    // Layout
    'meta.title': 'BOT Shield - Demo Store',
    'meta.description': 'ECサイト向け多層BOT対策システム実証デモ',

    // Nav
    'nav.products': 'Products',
    'nav.dashboard': 'Dashboard',
    'nav.store': 'Store',
    'nav.backToList': '\u2190 商品一覧',

    // Hero
    'hero.badge': '5層防御アクティブ',
    'hero.description':
      'マウス軌跡・キーボードタイミング・滞在時間をリアルタイム分析。\n転売BOTから商品を守る多層防御システムのデモンストレーション。',
    'hero.ctaDashboard': 'Dashboard を見る',
    'hero.ctaProducts': '商品を見る',

    // Products
    'products.title': '限定商品',
    'products.subtitle': '転売BOTに狙われやすい商品ラインナップ',
    'products.stock': (n: number) => `残り ${n} 点`,
    'products.viewDetail': '詳細を見る \u2192',

    // Product detail
    'product.taxIncluded': '(税込)',
    'product.stockLabel': '在庫状況:',
    'product.purchase': '購入する',
    'product.purchasing': '処理中...',
    'product.notFound': '商品が見つかりません',
    'product.backToTop': '\u2190 トップへ戻る',
    'product.shieldInfo':
      '🛡️ この購入は BOT Shield の5層防御で保護されています。マウス操作・キーボード入力・滞在時間などの行動データがリアルタイムで分析されます。',
    'product.networkError': 'ネットワークエラーが発生しました。',

    // Purchase result
    'result.allow.title': '購入完了',
    'result.allow.subtitle': 'ご注文を受け付けました。',
    'result.flag.title': '購入完了（レビュー対象）',
    'result.flag.subtitle':
      'ご注文を受け付けました。追加確認が行われる場合があります。',
    'result.challenge.title': '追加認証が必要です',
    'result.challenge.subtitle': 'セキュリティチャレンジを完了してください。',
    'result.block.title': '購入がブロックされました',
    'result.block.subtitle': '不審なアクティビティが検出されました。',

    // Turnstile challenge
    'challenge.title': '🔐 セキュリティチャレンジ',
    'challenge.description':
      '不審なアクティビティが検出されました。以下のチャレンジを完了してください。',

    // BotModeToggle
    'toggle.botMode': 'BOT Mode',
    'toggle.botActive': 'BOTとして行動中',
    'toggle.normalMode': '通常モード',
    'toggle.signalAnalysis': 'Signal Analysis',
    'toggle.monitoring': 'monitoring',
    'toggle.initializing': 'initializing',

    // Signal labels
    'signal.botdAutomation': '自動化ツール',
    'signal.turnstileFailed': 'Turnstile',
    'signal.rateLimitExceeded': 'Rate Limit',
    'signal.noMouseMovement': 'マウス操作',
    'signal.rapidPurchases': '連続購入',
    'signal.shortDwellTime': '滞在時間',
    'signal.abnormalKeyboard': 'キーボード',
    'signal.suspiciousUserAgent': 'User-Agent',

    // Dashboard
    'dashboard.title': 'Security Operations Center',
    'dashboard.updated': (time: string) => `Updated ${time}`,
    'dashboard.noEvents': 'No events recorded yet',

    // Stats cards
    'stats.totalEvents': 'Total Events (24h)',
    'stats.blocked': 'Blocked',
    'stats.blockRate': 'Block Rate',
    'stats.avgScore': 'Avg Risk Score',

    // Events table
    'events.title': 'Recent Events',
    'events.last': (n: number) => `Last ${n}`,
    'events.time': 'Time',
    'events.ip': 'IP Address',
    'events.path': 'Path',
    'events.score': 'Score',
    'events.level': 'Level',
    'events.action': 'Action',

    // Language switcher
    'lang.switch': 'EN',
  },

  en: {
    // Layout
    'meta.title': 'BOT Shield - Demo Store',
    'meta.description':
      'Multi-layer bot defense system demo for e-commerce',

    // Nav
    'nav.products': 'Products',
    'nav.dashboard': 'Dashboard',
    'nav.store': 'Store',
    'nav.backToList': '\u2190 Products',

    // Hero
    'hero.badge': '5-Layer Defense Active',
    'hero.description':
      'Real-time analysis of mouse trajectory, keyboard timing, and dwell time.\nA demo of a multi-layer defense system that protects products from scalper bots.',
    'hero.ctaDashboard': 'View Dashboard',
    'hero.ctaProducts': 'Browse Products',

    // Products
    'products.title': 'Limited Drops',
    'products.subtitle': 'Product lineup frequently targeted by scalper bots',
    'products.stock': (n: number) => `${n} left`,
    'products.viewDetail': 'View details \u2192',

    // Product detail
    'product.taxIncluded': '(tax incl.)',
    'product.stockLabel': 'Stock:',
    'product.purchase': 'Purchase',
    'product.purchasing': 'Processing...',
    'product.notFound': 'Product not found',
    'product.backToTop': '\u2190 Back to top',
    'product.shieldInfo':
      '🛡️ This purchase is protected by BOT Shield\'s 5-layer defense. Behavioral data such as mouse movement, keyboard input, and dwell time are analyzed in real time.',
    'product.networkError': 'A network error occurred.',

    // Purchase result
    'result.allow.title': 'Purchase Complete',
    'result.allow.subtitle': 'Your order has been accepted.',
    'result.flag.title': 'Purchase Complete (Under Review)',
    'result.flag.subtitle':
      'Your order has been accepted. Additional verification may be required.',
    'result.challenge.title': 'Additional Verification Required',
    'result.challenge.subtitle': 'Please complete the security challenge.',
    'result.block.title': 'Purchase Blocked',
    'result.block.subtitle': 'Suspicious activity has been detected.',

    // Turnstile challenge
    'challenge.title': '🔐 Security Challenge',
    'challenge.description':
      'Suspicious activity has been detected. Please complete the challenge below.',

    // BotModeToggle
    'toggle.botMode': 'BOT Mode',
    'toggle.botActive': 'Acting as BOT',
    'toggle.normalMode': 'Normal Mode',
    'toggle.signalAnalysis': 'Signal Analysis',
    'toggle.monitoring': 'monitoring',
    'toggle.initializing': 'initializing',

    // Signal labels
    'signal.botdAutomation': 'Automation',
    'signal.turnstileFailed': 'Turnstile',
    'signal.rateLimitExceeded': 'Rate Limit',
    'signal.noMouseMovement': 'Mouse',
    'signal.rapidPurchases': 'Rapid Buy',
    'signal.shortDwellTime': 'Dwell Time',
    'signal.abnormalKeyboard': 'Keyboard',
    'signal.suspiciousUserAgent': 'User-Agent',

    // Dashboard
    'dashboard.title': 'Security Operations Center',
    'dashboard.updated': (time: string) => `Updated ${time}`,
    'dashboard.noEvents': 'No events recorded yet',

    // Stats cards
    'stats.totalEvents': 'Total Events (24h)',
    'stats.blocked': 'Blocked',
    'stats.blockRate': 'Block Rate',
    'stats.avgScore': 'Avg Risk Score',

    // Events table
    'events.title': 'Recent Events',
    'events.last': (n: number) => `Last ${n}`,
    'events.time': 'Time',
    'events.ip': 'IP Address',
    'events.path': 'Path',
    'events.score': 'Score',
    'events.level': 'Level',
    'events.action': 'Action',

    // Language switcher
    'lang.switch': 'JA',
  },
} as const;

type TranslationValue = string | ((...args: never[]) => string);
type TranslationMap = typeof translations.ja;
export type TranslationKey = keyof TranslationMap;

export function getTranslation(locale: Locale, key: TranslationKey): TranslationValue {
  return translations[locale][key];
}

export function t(locale: Locale, key: TranslationKey, ...args: never[]): string {
  const value = translations[locale][key];
  if (typeof value === 'function') {
    return (value as (...a: never[]) => string)(...args);
  }
  return value as string;
}
