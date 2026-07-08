export type AccountTypeClassification = "unset" | "personal" | "organization" | "unknown";

export type AccountProfileLike = {
  job_type?: string | null;
  salon_name?: string | null;
  shop_address?: string | null;
};

export type AccountTypeOption = {
  value: string;
  label: string;
  classification: Exclude<AccountTypeClassification, "unset" | "unknown">;
};

export const PERSONAL_ACCOUNT_TYPE_OPTIONS: AccountTypeOption[] = [
  { value: "理容師", label: "理容師", classification: "personal" },
  { value: "美容師", label: "美容師", classification: "personal" },
  { value: "理容学生", label: "理容学生", classification: "personal" },
  { value: "美容学生", label: "美容学生", classification: "personal" },
  { value: "理美容アシスタント", label: "理美容アシスタント", classification: "personal" },
  { value: "アシスタント", label: "アシスタント", classification: "personal" },
  { value: "サロン", label: "サロン", classification: "personal" },
  { value: "サロンオーナー", label: "サロンオーナー", classification: "personal" },
  { value: "サロンスタッフ", label: "サロンスタッフ", classification: "personal" },
  { value: "理美容関係の個人", label: "理美容関係の個人", classification: "personal" },
];

export const ORGANIZATION_ACCOUNT_TYPE_OPTIONS: AccountTypeOption[] = [
  { value: "学校", label: "学校", classification: "organization" },
  { value: "理容学校", label: "理容学校", classification: "organization" },
  { value: "美容学校", label: "美容学校", classification: "organization" },
  { value: "メーカー", label: "メーカー", classification: "organization" },
  { value: "ディーラー", label: "ディーラー", classification: "organization" },
  { value: "組合", label: "組合", classification: "organization" },
  { value: "組合・団体", label: "組合・団体", classification: "organization" },
  { value: "求人会社", label: "求人会社", classification: "organization" },
  { value: "広告会社", label: "広告会社", classification: "organization" },
  { value: "その他企業", label: "その他企業", classification: "organization" },
  { value: "企業", label: "企業", classification: "organization" },
  { value: "閲覧のみ", label: "閲覧のみ", classification: "organization" },
];

export const ACCOUNT_TYPE_OPTIONS = [
  ...PERSONAL_ACCOUNT_TYPE_OPTIONS,
  ...ORGANIZATION_ACCOUNT_TYPE_OPTIONS,
];

const personalAliases = [
  ...PERSONAL_ACCOUNT_TYPE_OPTIONS.map((option) => option.value),
  "barber",
  "stylist",
  "student",
  "barber_student",
  "beauty_student",
  "assistant",
  "salon",
  "salon_owner",
  "salon_staff",
  "individual",
  "beauty_individual",
];

const organizationAliases = [
  ...ORGANIZATION_ACCOUNT_TYPE_OPTIONS.map((option) => option.value),
  "school",
  "maker",
  "manufacturer",
  "dealer",
  "union",
  "organization",
  "recruiter",
  "recruiting_company",
  "advertising_company",
  "company",
  "viewer",
];

const salonOwnerAliases = [
  "サロン",
  "サロンオーナー",
  "salon",
  "salon_owner",
  "owner",
  "shop_owner",
  "barber_shop_owner",
];

const aliasLabels = new Map<string, string>([
  ["barber", "理容師"],
  ["stylist", "美容師"],
  ["student", "学生"],
  ["barber_student", "理容学生"],
  ["beauty_student", "美容学生"],
  ["assistant", "アシスタント"],
  ["salon", "サロン"],
  ["salon_owner", "サロンオーナー"],
  ["salon_staff", "サロンスタッフ"],
  ["individual", "理美容関係の個人"],
  ["beauty_individual", "理美容関係の個人"],
  ["school", "学校"],
  ["maker", "メーカー"],
  ["manufacturer", "メーカー"],
  ["dealer", "ディーラー"],
  ["union", "組合・団体"],
  ["organization", "組合・団体"],
  ["recruiter", "求人会社"],
  ["recruiting_company", "求人会社"],
  ["advertising_company", "広告会社"],
  ["company", "企業"],
  ["viewer", "閲覧のみ"],
]);

function normalizeAccountType(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ").toLowerCase() ?? "";
}

function normalizedSet(values: string[]) {
  return new Set(values.map(normalizeAccountType));
}

const personalAccountTypes = normalizedSet(personalAliases);
const organizationAccountTypes = normalizedSet(organizationAliases);
const salonOwnerAccountTypes = normalizedSet(salonOwnerAliases);

export function getAccountType(profileOrValue: AccountProfileLike | string | null | undefined) {
  if (typeof profileOrValue === "string") {
    const value = profileOrValue.trim();
    return value.length > 0 ? value : null;
  }

  const value = profileOrValue?.job_type?.trim();
  return value && value.length > 0 ? value : null;
}

export function getAccountTypeLabel(profileOrValue: AccountProfileLike | string | null | undefined) {
  const accountType = getAccountType(profileOrValue);
  if (!accountType) return "未設定";

  const normalized = normalizeAccountType(accountType);
  return aliasLabels.get(normalized) ?? accountType;
}

export function classifyAccountType(profileOrValue: AccountProfileLike | string | null | undefined): AccountTypeClassification {
  const accountType = getAccountType(profileOrValue);
  if (!accountType) return "unset";

  const normalized = normalizeAccountType(accountType);
  if (personalAccountTypes.has(normalized)) return "personal";
  if (organizationAccountTypes.has(normalized)) return "organization";
  return "unknown";
}

export function isPersonalCreator(profileOrValue: AccountProfileLike | string | null | undefined) {
  return classifyAccountType(profileOrValue) === "personal";
}

export function isOrganizationAccount(profileOrValue: AccountProfileLike | string | null | undefined) {
  return classifyAccountType(profileOrValue) === "organization";
}

export function canCreateSnap(profileOrValue: AccountProfileLike | string | null | undefined) {
  return isPersonalCreator(profileOrValue);
}

export function canCreateArticle(profileOrValue: AccountProfileLike | string | null | undefined) {
  return isPersonalCreator(profileOrValue);
}

export function canCreateReport(profileOrValue: AccountProfileLike | string | null | undefined) {
  return isPersonalCreator(profileOrValue);
}

export function canCreateQa(profileOrValue: AccountProfileLike | string | null | undefined) {
  return isPersonalCreator(profileOrValue);
}

export function canCreateBackroom(profileOrValue: AccountProfileLike | string | null | undefined) {
  return isPersonalCreator(profileOrValue);
}

export function canCreateJob(profileOrValue: AccountProfileLike | string | null | undefined) {
  const accountType = getAccountType(profileOrValue);
  return Boolean(accountType && salonOwnerAccountTypes.has(normalizeAccountType(accountType)));
}

export function canCreateSuccession(profileOrValue: AccountProfileLike | string | null | undefined) {
  return canCreateJob(profileOrValue);
}
