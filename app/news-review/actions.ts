"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runNewsDraftPipeline } from "@/lib/news-drafts/ingest";
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
  const reviewedAt = status === "pending" ? null : new Date().toISOString();

  const payload = {
    draft_title: cleanText(formData.get("draft_title"), 120),
    draft_summary: cleanText(formData.get("draft_summary"), 500),
    draft_body: cleanText(formData.get("draft_body"), 3000),
    morning_tip: cleanText(formData.get("morning_tip"), 400),
    conversation_tip: cleanText(formData.get("conversation_tip"), 400),
    category: cleanText(formData.get("category"), 80) || "ニュース",
    fact_check_notes: cleanText(formData.get("fact_check_notes"), 1000),
    status,
    reviewed_at: reviewedAt,
    reviewed_by: status === "pending" ? null : user.id,
  };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("news_drafts").update(payload).eq("id", id);

  if (error) {
    redirect(`/news-review?id=${encodeURIComponent(id)}&error=${encodeURIComponent("下書きを保存できませんでした。")}`);
  }

  revalidatePath("/news-review");
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
  });

  revalidatePath("/news-review");
  redirect(`/news-review?run=1&${params.toString()}`);
}
