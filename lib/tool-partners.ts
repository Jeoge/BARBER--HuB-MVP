export type ToolPartnerType = "online-store" | "manufacturer" | "dealer" | "regional-dealer" | "seminar";

export type ToolPartnerLabel = "PR" | "Sponsored" | "協賛" | "Partner" | "提供";

export type ToolPartner = {
  id: string;
  name: string;
  type: ToolPartnerType;
  label: ToolPartnerLabel;
  area: string;
  description: string;
  href: string;
  imageUrl?: string;
  categories: string[];
  isSponsored: boolean;
  external?: boolean;
};

export const toolPartners: ToolPartner[] = [
  {
    id: "beauty-garage-sample",
    name: "BEAUTY GARAGE（サンプル導線）",
    type: "online-store",
    label: "PR",
    area: "全国",
    description: "プロ向け理美容器具・用品をオンラインで確認できる購入導線のサンプルです。",
    href: "https://example.com/beauty-garage-sample",
    imageUrl: "/images/tools-stilllife.jpg",
    categories: ["バリカン", "トリマー", "コーム", "店販"],
    isSponsored: true,
    external: true,
  },
  {
    id: "sample-maker-clipper",
    name: "サンプルクリッパーメーカー",
    type: "manufacturer",
    label: "Sponsored",
    area: "全国",
    description: "バリカン・トリマーの使い方や講習情報を発信するメーカー枠です。",
    href: "/profiles/sample-maker-clipper",
    imageUrl: "/images/tools-stilllife.jpg",
    categories: ["バリカン", "トリマー", "講習"],
    isSponsored: true,
  },
  {
    id: "sample-dealer-national",
    name: "全国サンプルディーラー",
    type: "dealer",
    label: "協賛",
    area: "全国",
    description: "複数メーカーの道具比較、講習、開業準備を相談できる全国ディーラー枠です。",
    href: "/profiles/sample-dealer-national",
    imageUrl: "/images/shop-interior.jpg",
    categories: ["開業", "比較相談", "講習"],
    isSponsored: true,
  },
  {
    id: "sample-dealer-kyushu",
    name: "九州サンプルディーラー",
    type: "regional-dealer",
    label: "Partner",
    area: "九州・沖縄",
    description: "地域のサロンに合わせた道具相談、講習会、導入相談ができる地域ディーラー枠です。",
    href: "/profiles/sample-dealer-kyushu",
    imageUrl: "/images/shop-interior.jpg",
    categories: ["地域相談", "講習", "開業"],
    isSponsored: false,
  },
  {
    id: "sample-tool-seminar",
    name: "メーカー講習・商品説明会",
    type: "seminar",
    label: "Sponsored",
    area: "オンライン / 地域",
    description: "道具の特徴や使い方を、メーカーやディーラーの講習で確認できます。",
    href: "/seminars",
    imageUrl: "/images/fade-cut.jpg",
    categories: ["講習", "商品説明", "技術"],
    isSponsored: true,
  },
];

export function toolPartnersByType(type: ToolPartnerType) {
  return toolPartners.filter((partner) => partner.type === type);
}

export function primaryToolPartner(type: ToolPartnerType) {
  const partner = toolPartnersByType(type)[0];
  if (partner == null) {
    throw new Error(`Missing tool partner for type: ${type}`);
  }
  return partner;
}
