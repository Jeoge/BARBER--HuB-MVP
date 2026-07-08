export const SUCCESSION_NOTICE =
  "BARBER HUBは開業・承継情報の掲載場所です。条件確認、契約、金銭のやり取り、法務・税務・不動産に関する判断は、当事者間および専門家に確認のうえ進めてください。";

export const SUCCESSION_DIRECT_NOTICE =
  "詳細条件の確認や契約は、掲載者・希望者・専門家の間で直接行ってください。BARBER HUBは情報掲載と問い合わせ導線を提供します。";

export const SUCCESSION_FALLBACK_IMAGE = "/images/shop-interior.jpg";

export const SUCCESSION_LISTING_TYPES = [
  "居抜き・設備譲渡",
  "事業承継",
  "後継者募集",
  "開業希望",
  "設備譲渡",
  "その他相談",
];

export const SUCCESSION_BUSINESS_TYPES = [
  "理容室",
  "バーバー",
  "メンズサロン",
  "一人営業",
  "小規模サロン",
  "設備のみ",
  "開業希望者",
  "その他",
];

export const SUCCESSION_STATUS_OPTIONS = [
  { value: "published", label: "公開中" },
  { value: "draft", label: "下書き" },
  { value: "closed", label: "停止中" },
] as const;

export const SUCCESSION_CONTACT_METHODS = [
  "運営確認後に共有",
  "問い合わせ後に段階的に共有",
  "専門家同席で確認",
  "まずは匿名相談",
];

export const SUCCESSION_PRIVATE_WARNING =
  "公開用タイトル・説明文には、店舗名、正確な住所、売上、利益、家賃、譲渡希望額、借入、顧客数、個人連絡先を書かないでください。";

export function uniqueTextValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}
