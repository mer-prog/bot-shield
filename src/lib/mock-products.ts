import type { Locale } from './i18n';

export interface Product {
  id: string;
  name: { ja: string; en: string };
  price: number;
  stock: number;
  description: { ja: string; en: string };
  category: { ja: string; en: string };
  emoji: string;
  gradientFrom: string;
  gradientTo: string;
}

export interface LocalizedProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  category: string;
  emoji: string;
  gradientFrom: string;
  gradientTo: string;
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'nike-air-max-95-neon',
    name: {
      ja: 'Nike Air Max 95 OG "Neon" 限定復刻',
      en: 'Nike Air Max 95 OG "Neon" Limited Reissue',
    },
    price: 32_800,
    stock: 3,
    description: {
      ja: '1995年の名作が限定復刻。人体の筋肉や皮膚をモチーフにした革新的デザイン。転売ヤーの標的となる超人気モデル。',
      en: 'The 1995 classic returns in a limited reissue. Innovative design inspired by the human body. A highly sought-after model frequently targeted by resellers.',
    },
    category: { ja: 'スニーカー', en: 'Sneakers' },
    emoji: '👟',
    gradientFrom: '#e11d48',
    gradientTo: '#f97316',
  },
  {
    id: 'ps5-pro',
    name: { ja: 'PlayStation 5 Pro', en: 'PlayStation 5 Pro' },
    price: 79_980,
    stock: 2,
    description: {
      ja: '次世代ゲーミングの究極形。8K出力対応、超高速SSD搭載。発売日の在庫は即完売が予想される。',
      en: 'The ultimate next-gen gaming console. 8K output, ultra-fast SSD. Launch day stock is expected to sell out instantly.',
    },
    category: { ja: 'ゲーム機', en: 'Gaming' },
    emoji: '🎮',
    gradientFrom: '#2563eb',
    gradientTo: '#7c3aed',
  },
  {
    id: 'metal-build-strike-freedom',
    name: {
      ja: 'METAL BUILD ストライクフリーダムガンダム',
      en: 'METAL BUILD Strike Freedom Gundam',
    },
    price: 33_000,
    stock: 5,
    description: {
      ja: 'ダイキャスト合金使用の最高峰フィギュア。精密なディテールと可動域を両立。コレクター垂涎の限定生産品。',
      en: 'Premium die-cast alloy figure. Combines precise detail with articulation. A limited-production collectible coveted by enthusiasts.',
    },
    category: { ja: 'フィギュア', en: 'Figures' },
    emoji: '🤖',
    gradientFrom: '#8b5cf6',
    gradientTo: '#ec4899',
  },
  {
    id: 'supreme-box-logo-hoodie',
    name: {
      ja: 'Supreme Box Logo Hoodie FW24',
      en: 'Supreme Box Logo Hoodie FW24',
    },
    price: 48_000,
    stock: 1,
    description: {
      ja: 'ストリートファッションの象徴。毎シーズン即完売のBox Logoシリーズ最新作。世界中のリセラーが狙う一品。',
      en: 'An icon of street fashion. The latest Box Logo that sells out every season. Targeted by resellers worldwide.',
    },
    category: { ja: 'ファッション', en: 'Fashion' },
    emoji: '👕',
    gradientFrom: '#475569',
    gradientTo: '#1e293b',
  },
  {
    id: 'pokemon-card-151-box',
    name: {
      ja: 'ポケモンカード 151 未開封BOX',
      en: 'Pokemon Card 151 Sealed Box',
    },
    price: 55_000,
    stock: 4,
    description: {
      ja: '初代151匹を収録した記念パック。未開封BOXはプレミアム価格で取引される投資対象としても人気。',
      en: 'Commemorative pack featuring the original 151. Sealed boxes trade at premium prices, popular as collectible investments.',
    },
    category: { ja: 'トレカ', en: 'TCG' },
    emoji: '🃏',
    gradientFrom: '#d97706',
    gradientTo: '#65a30d',
  },
];

export function getLocalizedProducts(locale: Locale): LocalizedProduct[] {
  return MOCK_PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name[locale],
    price: p.price,
    stock: p.stock,
    description: p.description[locale],
    category: p.category[locale],
    emoji: p.emoji,
    gradientFrom: p.gradientFrom,
    gradientTo: p.gradientTo,
  }));
}

export function getProductById(
  id: string,
  locale: Locale = 'ja',
): LocalizedProduct | undefined {
  const product = MOCK_PRODUCTS.find((p) => p.id === id);
  if (!product) return undefined;
  return {
    id: product.id,
    name: product.name[locale],
    price: product.price,
    stock: product.stock,
    description: product.description[locale],
    category: product.category[locale],
    emoji: product.emoji,
    gradientFrom: product.gradientFrom,
    gradientTo: product.gradientTo,
  };
}
