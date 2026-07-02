export type JobListing = {
  id: string;
  salonName: string;
  prefecture: string;
  city: string;
  areaLabel: string;
  roles: string[];
  employmentTypes: string[];
  salary: string;
  holidays: string;
  workingHours: string;
  benefits: string[];
  tags: string[];
  description: string;
  message: string;
  imageUrl: string;
  featured: boolean;
  sponsored: boolean;
};

export const prefectures = ["福岡県", "東京都", "大阪府", "愛知県", "神奈川県"];

export const citiesByPrefecture: Record<string, string[]> = {
  福岡県: ["福岡市中央区", "福岡市博多区", "福岡市西区", "北九州市", "久留米市"],
  東京都: ["渋谷区", "新宿区", "世田谷区", "中央区"],
  大阪府: ["大阪市中央区", "大阪市北区", "堺市"],
  愛知県: ["名古屋市中区", "名古屋市東区", "岡崎市"],
  神奈川県: ["横浜市西区", "川崎市", "藤沢市"],
};

export const jobListings: JobListing[] = [
  {
    id: "barber-sample-fukuoka-nishi",
    salonName: "BARBER SAMPLE 福岡西",
    prefecture: "福岡県",
    city: "福岡市西区",
    areaLabel: "福岡県 福岡市西区",
    roles: ["アシスタント", "スタイリスト"],
    employmentTypes: ["正社員", "パート相談可"],
    salary: "月給 22万円から / 技術歩合あり",
    holidays: "月8日 / 相談可",
    workingHours: "9:00から19:00",
    benefits: ["雇用保険", "労災保険", "交通費相談"],
    tags: ["メンズ特化", "フェード", "顔剃りあり", "教育あり", "駅近", "少人数サロン"],
    description: "地域の男性客に支持されるメンズ特化サロンです。フェードや顔剃りを丁寧に学びながら、落ち着いた接客を身につけられます。",
    message: "まずは見学から気軽にお越しください。お店の空気を見てから、面接に進むか決めても大丈夫です。",
    imageUrl: "/images/shop-interior.jpg",
    featured: false,
    sponsored: false,
  },
  {
    id: "classic-barber-shibuya",
    salonName: "CLASSIC BARBER 渋谷",
    prefecture: "東京都",
    city: "渋谷区",
    areaLabel: "東京都 渋谷区",
    roles: ["スタイリスト"],
    employmentTypes: ["正社員"],
    salary: "月給 28万円から / 指名歩合あり",
    holidays: "完全週休2日相談可",
    workingHours: "10:00から20:00",
    benefits: ["社会保険相談", "講習会補助", "道具購入補助"],
    tags: ["メンズ特化", "40代以上の男性客が多い", "単価高め", "教育あり"],
    description: "ビジネスマン向けのカット、白髪ぼかし、シェービング提案が多いサロンです。落ち着いた接客と提案力を磨きたい方に向いています。",
    message: "数字だけではなく、長く通ってもらえる関係づくりを大切にしています。",
    imageUrl: "/images/shop-interior.jpg",
    featured: true,
    sponsored: false,
  },
  {
    id: "fade-lab-osaka",
    salonName: "FADE LAB 大阪",
    prefecture: "大阪府",
    city: "大阪市中央区",
    areaLabel: "大阪府 大阪市中央区",
    roles: ["アシスタント", "スタイリスト"],
    employmentTypes: ["正社員", "業務委託相談可"],
    salary: "月給 24万円から / 売上歩合あり",
    holidays: "月7日から8日",
    workingHours: "11:00から21:00",
    benefits: ["技術練習会", "SNS撮影サポート", "交通費相談"],
    tags: ["フェード", "若手歓迎", "撮影あり", "駅近"],
    description: "フェード、ショート、バーバースタイルの入客が多いサロンです。営業後の練習会で基礎から確認できます。",
    message: "フェードを武器にしたい方、技術をもっと深めたい方を歓迎します。",
    imageUrl: "/images/shop-interior.jpg",
    featured: false,
    sponsored: false,
  },
  {
    id: "gentlemen-aichi",
    salonName: "GENTLEMEN'S ROOM 愛知",
    prefecture: "愛知県",
    city: "名古屋市中区",
    areaLabel: "愛知県 名古屋市中区",
    roles: ["理容学生", "アシスタント"],
    employmentTypes: ["アルバイト", "正社員登用あり"],
    salary: "時給 1,150円から / 正社員登用あり",
    holidays: "シフト相談可",
    workingHours: "10:00から19:30",
    benefits: ["学校との両立相談", "練習モデルサポート", "接客研修"],
    tags: ["学生歓迎", "教育あり", "顔剃りあり", "少人数サロン"],
    description: "理容学生やアシスタントが、接客と基礎技術を落ち着いて学べるサロンです。",
    message: "まだ技術に自信がなくても大丈夫です。見学で雰囲気を感じてください。",
    imageUrl: "/images/shop-interior.jpg",
    featured: false,
    sponsored: false,
  },
  {
    id: "yokohama-shave-house",
    salonName: "YOKOHAMA SHAVE HOUSE",
    prefecture: "神奈川県",
    city: "横浜市西区",
    areaLabel: "神奈川県 横浜市西区",
    roles: ["スタイリスト", "シェービング担当"],
    employmentTypes: ["正社員", "パート相談可"],
    salary: "月給 25万円から / 経験考慮",
    holidays: "月8日 / 土日相談可",
    workingHours: "9:30から19:00",
    benefits: ["社会保険相談", "産休育休相談", "講習会補助"],
    tags: ["顔剃りあり", "40代以上の男性客が多い", "駅近", "落ち着いた雰囲気"],
    description: "シェービングとヘッドスパのリピートが多い、落ち着いた雰囲気のサロンです。",
    message: "技術だけでなく、お客様が安心して通える空気づくりを大切にしています。",
    imageUrl: "/images/shop-interior.jpg",
    featured: false,
    sponsored: false,
  },
];

export function findJobListing(id: string) {
  return jobListings.find((job) => job.id === id);
}

// Future monetization note:
// Basic job listing is planned to stay free so salons can start easily.
// Paid options may later include regional top placement, featured jobs, PR slots,
// and sponsored frames. PR/sponsored jobs must always be clearly labeled.
