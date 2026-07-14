"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runNewsDraftPipeline } from "@/lib/news-drafts/ingest";
import { isSafePublicSourceUrl } from "@/lib/news-drafts/public-news";
import { requireNewsReviewAdmin } from "@/lib/news-drafts/review";
import { createSupabaseAdminClient, getSupabaseAdminConfigStatus } from "@/lib/supabase/admin";

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function cleanStatus(value: FormDataEntryValue | null) {
  if (value === "approve") return "approved";
  if (value === "reject") return "rejected";
  return "pending";
}

type CurrentNewsDraft = {
  status: "pending" | "approved" | "rejected";
  source_name: string | null;
  source_url: string | null;
  generation_error: string | null;
  duplicate_of: string | null;
  risk_level: "low" | "medium" | "high" | null;
  reviewed_at: string | null;
};

export async function saveNewsDraftAction(formData: FormData) {
  const user = await requireNewsReviewAdmin();
  const config = getSupabaseAdminConfigStatus();

  if (!config.ready) {
    redirect(`/news-review?error=${encodeURIComponent("Supabase管理用の環境変数が未設定です。")}`);
  }

  const id = cleanText(formData.get("id"), 80);
  if (!id) {
    redirect(`/news-review?error=${encodeURIComponent("下書きIDが見つかりません。")}`);
  }

  const status = cleanStatus(formData.get("intent"));
  const now = new Date().toISOString();
  const category = cleanText(formData.get("category"), 80);

  const payload = {
    draft_title: cleanText(formData.get("draft_title"), 120),
    draft_summary: cleanText(formData.get("draft_summary"), 500),
    draft_body: cleanText(formData.get("draft_body"), 3000),
    morning_tip: cleanText(formData.get("morning_tip"), 400),
    conversation_tip: cleanText(formData.get("conversation_tip"), 400),
    category: category || "ニュース",
    fact_check_notes: cleanText(formData.get("fact_check_notes"), 1000),
    status,
    reviewed_at: null as string | null,
    reviewed_by: status === "pending" ? null : user.id,
  };

  if (status === "approved" && !payload.draft_title) {
    redirect(`/news-review?id=${encodeURIComponent(id)}&error=${encodeURIComponent("下書きタイトルを入力してください。")}`);
  }

  const supabase = createSupabaseAdminClient();
  const { data: currentDraft, error: currentDraftError } = await supabase
    .from("news_drafts")
    .select("status, source_name, source_url, generation_error, duplicate_of, risk_level, reviewed_at")
    .eq("id", id)
    .maybeSingle<CurrentNewsDraft>();

  if (currentDraftError || !currentDraft) {
    redirect(`/news-review?id=${encodeURIComponent(id)}&error=${encodeURIComponent("下書きを確認できませんでした。")}`);
  }

  if (status === "approved") {
    const missing: string[] = [];
    const sourceUrl = cleanText(currentDraft.source_url, 1000);
    if (!payload.draft_title) missing.push("タイトル");
    if (!payload.draft_summary) missing.push("要約");
    if (!payload.draft_body) missing.push("本文");
    if (!payload.morning_tip) missing.push("朝礼で使う文章");
    if (!payload.conversation_tip) missing.push("お客様との会話用の文章");
    if (!category) missing.push("カテゴリー");
    if (!sourceUrl) missing.push("元記事URL");
    if (!cleanText(currentDraft.source_name, 200)) missing.push("情報元名");

    if (missing.length > 0) {
      redirect(`/news-review?id=${encodeURIComponent(id)}&error=${encodeURIComponent(`公開に必要な項目が不足しています: ${missing.join("、")}`)}`);
    }

    if (!isSafePublicSourceUrl(sourceUrl)) {
      redirect(`/news-review?id=${encodeURIComponent(id)}&error=${encodeURIComponent("元記事URLが安全なhttpまたはhttps形式ではありません。")}`);
    }

    if (currentDraft.generation_error) {
      redirect(`/news-review?id=${encodeURIComponent(id)}&error=${encodeURIComponent("生成エラーが残っているため公開できません。")}`);
    }

    if (currentDraft.duplicate_of) {
      redirect(`/news-review?id=${encodeURIComponent(id)}&error=${encodeURIComponent("重複候補の記事は公開できません。")}`);
    }

    if (currentDraft.risk_level === "high" && !payload.fact_check_notes) {
      redirect(`/news-review?id=${encodeURIComponent(id)}&error=${encodeURIComponent("重要度の高い記事はファクトチェックメモを入力してから公開してください。")}`);
    }
  }

  payload.reviewed_at = status === "pending" ? null : status === "approved" && currentDraft.status === "approved" ? (currentDraft.reviewed_at ?? now) : now;

  const { error } = await supabase.from("news_drafts").update(payload).eq("id", id);

  if (error) {
    redirect(`/news-review?id=${encodeURIComponent(id)}&error=${encodeURIComponent("下書きを保存できませんでした。")}`);
  }

  revalidatePath("/news-review");
  if (status === "approved" || currentDraft.status === "approved") {
    revalidatePath("/");
    revalidatePath(`/news/${id}`);
  }
  redirect(`/news-review?id=${encodeURIComponent(id)}&saved=1`);
}

export async function runNewsDraftIngestAction() {
  await requireNewsReviewAdmin();
  const config = getSupabaseAdminConfigStatus();

  if (!config.ready) {
    redirect(`/news-review?error=${encodeURIComponent("Supabase管理用の環境変数が未設定です。")}`);
  }

  let result: Awaited<ReturnType<typeof runNewsDraftPipeline>>;

  try {
    result = await runNewsDraftPipeline();
  } catch {
    redirect(`/news-review?error=${encodeURIComponent("ニュース収集を実行できませんでした。環境変数とSupabase migrationを確認してください。")}`);
  }

  const params = new URLSearchParams({
    fetched: String(result.fetchedCount),
    duplicate: String(result.duplicateCount),
    skipped: String(result.skippedCount),
    generated: String(result.generatedCount),
    failed: String(result.failedCount),
    sourceErrors: String(result.sourceErrorCount),
  });

  revalidatePath("/news-review");
  redirect(`/news-review?run=1&${params.toString()}`);
}
