export interface Product {
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

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'nike-air-max-95-neon',
    name: 'Nike Air Max 95 OG "Neon" 限定復刻',
    price: 32_800,
    stock: 3,
    description:
      '1995年の名作が限定復刻。人体の筋肉や皮膚をモチーフにした革新的デザイン。転売ヤーの標的となる超人気モデル。',
    category: 'スニーカー',
    emoji: '👟',
    gradientFrom: '#e11d48',
    gradientTo: '#f97316',
  },
  {
    id: 'ps5-pro',
    name: 'PlayStation 5 Pro',
    price: 79_980,
    stock: 2,
    description:
      '次世代ゲーミングの究極形。8K出力対応、超高速SSD搭載。発売日の在庫は即完売が予想される。',
    category: 'ゲーム機',
    emoji: '🎮',
    gradientFrom: '#2563eb',
    gradientTo: '#7c3aed',
  },
  {
    id: 'metal-build-strike-freedom',
    name: 'METAL BUILD ストライクフリーダムガンダム',
    price: 33_000,
    stock: 5,
    description:
      'ダイキャスト合金使用の最高峰フィギュア。精密なディテールと可動域を両立。コレクター垂涎の限定生産品。',
    category: 'フィギュア',
    emoji: '🤖',
    gradientFrom: '#8b5cf6',
    gradientTo: '#ec4899',
  },
  {
    id: 'supreme-box-logo-hoodie',
    name: 'Supreme Box Logo Hoodie FW24',
    price: 48_000,
    stock: 1,
    description:
      'ストリートファッションの象徴。毎シーズン即完売のBox Logoシリーズ最新作。世界中のリセラーが狙う一品。',
    category: 'ファッション',
    emoji: '👕',
    gradientFrom: '#475569',
    gradientTo: '#1e293b',
  },
  {
    id: 'pokemon-card-151-box',
    name: 'ポケモンカード 151 未開封BOX',
    price: 55_000,
    stock: 4,
    description:
      '初代151匹を収録した記念パック。未開封BOXはプレミアム価格で取引される投資対象としても人気。',
    category: 'トレカ',
    emoji: '🃏',
    gradientFrom: '#d97706',
    gradientTo: '#65a30d',
  },
];

export function getProductById(id: string): Product | undefined {
  return MOCK_PRODUCTS.find((p) => p.id === id);
}
