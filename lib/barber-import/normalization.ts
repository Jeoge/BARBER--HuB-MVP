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
