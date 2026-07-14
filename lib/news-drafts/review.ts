import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type NewsDraftStatus = "pending" | "approved" | "rejected";
export type NewsDraftRiskLevel = "low" | "medium" | "high";
export type NewsDraftTitleAngle = "work" | "personal" | "conversation";
export type NewsDraftTitleCandidates = Partial<Record<NewsDraftTitleAngle, string | null>>;

export type NewsDraftRecord = {
  id: string;
  source_name: string;
  source_url: string;
  source_title: string;
  source_published_at: string | null;
  fetched_at: string | null;
  source_excerpt: string | null;
  source_type: string | null;
  category: string | null;
  relevance_score: number | null;
  relevance_reason: string | null;
  draft_title: string | null;
  title_candidates: NewsDraftTitleCandidates | null;
  primary_angle: NewsDraftTitleAngle | null;
  draft_summary: string | null;
  draft_body: string | null;
  morning_tip: string | null;
  conversation_tip: string | null;
  fact_check_notes: string | null;
  risk_level: NewsDraftRiskLevel | null;
  status: NewsDraftStatus;
  generation_error: string | null;
  duplicate_key: string | null;
  duplicate_of: string | null;
  created_at: string | null;
  updated_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export type NewsReviewUser = {
  id: string;
};

export function configuredNewsReviewAdminIds() {
  return (process.env.NEWS_REVIEW_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function requireNewsReviewAdmin(): Promise<NewsReviewUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const adminIds = configuredNewsReviewAdminIds();
  if (adminIds.length === 0 || !adminIds.includes(user.id)) {
    notFound();
  }

  return { id: user.id };
}

export function newsDraftReviewStage(draft: Pick<NewsDraftRecord, "status" | "draft_title" | "generation_error">) {
  if (draft.generation_error) return "error";
  if (draft.status === "approved") return "approved";
  if (draft.status === "rejected") return "rejected";
  if (!draft.draft_title) return "waiting_generation";
  return "pending_review";
}

export async function listNewsDrafts(supabase: SupabaseClient, limit = 80) {
  const { data, error } = await supabase
    .from("news_drafts")
    .select(
      `
      id,
      source_name,
      source_url,
      source_title,
      source_published_at,
      fetched_at,
      source_excerpt,
      source_type,
      category,
      relevance_score,
      relevance_reason,
      draft_title,
      title_candidates,
      primary_angle,
      draft_summary,
      draft_body,
      morning_tip,
      conversation_tip,
      fact_check_notes,
      risk_level,
      status,
      generation_error,
      duplicate_key,
      duplicate_of,
      created_at,
      updated_at,
      reviewed_at,
      reviewed_by
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  return {
    drafts: (data ?? []) as NewsDraftRecord[],
    error,
  };
}
