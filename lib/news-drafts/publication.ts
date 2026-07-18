export type PublicNewsFields = {
  draft_title?: string | null;
  draft_summary?: string | null;
  draft_body?: string | null;
  morning_tip?: string | null;
  conversation_tip?: string | null;
  category?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  reviewed_at?: string | null;
};

export type NewsPublicationInput = PublicNewsFields & {
  status?: string | null;
  generation_error?: string | null;
  duplicate_of?: string | null;
  content_pillar?: string | null;
};

type BlockerOptions = {
  requireReviewedAt?: boolean;
};

const PUBLIC_NEWS_REQUIRED_FIELDS: Array<{
  key: keyof Pick<
    PublicNewsFields,
    "draft_title" | "draft_summary" | "draft_body" | "morning_tip" | "conversation_tip" | "category" | "source_name" | "source_url"
  >;
  label: string;
}> = [
  { key: "draft_title", label: "タイトル" },
  { key: "draft_summary", label: "要約" },
  { key: "draft_body", label: "本文" },
  { key: "morning_tip", label: "朝礼のヒント" },
  { key: "conversation_tip", label: "会話のヒント" },
  { key: "category", label: "カテゴリー" },
  { key: "source_name", label: "情報元名" },
  { key: "source_url", label: "元記事URL" },
];

const PUBLIC_NEWS_CONTENT_PILLARS = new Set(["work", "style", "talk"]);

export function cleanPublicationText(value: string | null | undefined) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function getSafePublicSourceUrl(value: string | null | undefined) {
  const sourceUrl = cleanPublicationText(value);
  if (!sourceUrl) return null;

  try {
    const url = new URL(sourceUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function isSafePublicSourceUrl(value: string | null | undefined) {
  return getSafePublicSourceUrl(value) != null;
}

export function isPublicNewsContentPillar(value: string | null | undefined) {
  return PUBLIC_NEWS_CONTENT_PILLARS.has(cleanPublicationText(value));
}

export function getPublicNewsFieldBlocker(fields: PublicNewsFields, options: BlockerOptions = {}) {
  if (options.requireReviewedAt && !cleanPublicationText(fields.reviewed_at)) {
    return "公開日時が保存されていないため公開できません。";
  }

  for (const field of PUBLIC_NEWS_REQUIRED_FIELDS) {
    if (!cleanPublicationText(fields[field.key])) {
      return `${field.label}が空のため公開できません。`;
    }
  }

  if (!isSafePublicSourceUrl(fields.source_url)) {
    return "元記事URLが安全なhttpまたはhttps形式ではないため公開できません。";
  }

  return null;
}

export function getNewsPublicationBlocker(draft: NewsPublicationInput, options: BlockerOptions = {}) {
  if (draft.status !== "approved") {
    return "ステータスがapprovedではないため公開できません。";
  }

  if (cleanPublicationText(draft.generation_error)) {
    return "生成エラーが残っているため公開できません。";
  }

  if (cleanPublicationText(draft.duplicate_of)) {
    return "重複候補の記事は公開できません。";
  }

  if (!isPublicNewsContentPillar(draft.content_pillar)) {
    return "分類（WORK / STYLE / TALK）が未設定のため公開できません。";
  }

  return getPublicNewsFieldBlocker(draft, options);
}
