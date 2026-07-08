export const JOB_DIRECT_CONTACT_NOTICE =
  "BARBER HUBは求人情報の掲載場所です。応募・見学・勤務条件の確認は、掲載サロンと応募者の間で直接行ってください。";

export const JOB_FALLBACK_IMAGE = "/images/shop-interior.jpg";

export const JOB_PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
];

export const JOB_TITLE_OPTIONS = ["アシスタント", "スタイリスト", "理容師", "見習い", "パート", "その他"];

export const EMPLOYMENT_TYPE_OPTIONS = ["正社員", "パート・アルバイト", "業務委託", "面貸し", "相談可"];

export const JOB_TAG_OPTIONS = [
  "見学歓迎",
  "学生歓迎",
  "アシスタント歓迎",
  "フェード",
  "シェービング",
  "メンズ特化",
  "少人数サロン",
  "パート相談可",
  "ブランクOK",
  "独立支援",
  "技術を学べる",
];

export const JOB_STATUS_OPTIONS = [
  { value: "published", label: "掲載中" },
  { value: "draft", label: "下書き" },
  { value: "closed", label: "停止中" },
] as const;

export function splitJobMultiValue(value: string | null | undefined) {
  return (value ?? "")
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function uniqueTextValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}
