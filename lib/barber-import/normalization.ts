const HYPHEN_PATTERN = /[‐‑‒–—―ー－ｰ−]/g;
const SPACE_PATTERN = /[\s\u3000]+/g;

export function normalizeImportText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKC")
    .replace(HYPHEN_PATTERN, "-")
    .replace(SPACE_PATTERN, " ")
    .trim()
    .toLowerCase();
}

export function normalizeImportPhone(value: string | null | undefined) {
  return (value ?? "").normalize("NFKC").replace(/[^0-9]/g, "");
}

export function cleanImportText(value: string | null | undefined, maxLength = 500) {
  return (value ?? "")
    .normalize("NFKC")
    .replace(SPACE_PATTERN, " ")
    .trim()
    .slice(0, maxLength);
}

export function cleanImportPhone(value: string | null | undefined) {
  const text = cleanImportText(value, 80);
  return text.length > 0 ? text : null;
}

export function normalizeCsvImportVerificationStatus(value: string | null | undefined) {
  const text = cleanImportText(value, 40).toLowerCase();

  if (!text || text === "未認証" || text === "未認証店舗" || text === "unverified") {
    return { status: "unverified" as const, error: null };
  }

  return {
    status: "unverified" as const,
    error: "CSV取込では認証状態を変更できません。公開資料から取り込む店舗は未認証だけ登録できます。",
  };
}
