"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBarberHubAdmin } from "@/lib/admin/permissions";
import { createSupabaseAdminClient, getSupabaseAdminConfigStatus } from "@/lib/supabase/admin";

type ReviewActionResult = {
  claim_id: string;
  shop_id: string;
  applicant_user_id: string;
  resulting_claim_status: string;
  resulting_shop_verification_status: string;
};

function redirectWithParams(params: Record<string, string | number | null | undefined>): never {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") searchParams.set(key, String(value));
  }

  redirect(`/admin/barber-shops/claims?${searchParams.toString()}`);
  throw new Error("unreachable");
}

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function cleanDecision(value: FormDataEntryValue | null) {
  if (value === "approve") return "approve";
  if (value === "reject") return "reject";
  return "";
}

export async function reviewBarberShopClaimAction(formData: FormData) {
  const user = await requireBarberHubAdmin();
  const config = getSupabaseAdminConfigStatus();

  if (!config.ready) {
    redirectWithParams({ error: "Supabase管理用の環境変数が未設定です。" });
  }

  const claimId = cleanText(formData.get("claimId"), 80);
  const decision = cleanDecision(formData.get("decision"));
  const reviewNote = cleanText(formData.get("reviewNote"), 500);

  if (!claimId || !decision) {
    redirectWithParams({ error: "申請IDまたは審査操作を確認できませんでした。" });
  }

  const { data, error } = await createSupabaseAdminClient()
    .rpc("review_barber_shop_claim", {
      target_claim_id: claimId,
      review_action: decision,
      reviewer_user_id: user.id,
      reviewer_note: reviewNote,
    })
    .single<ReviewActionResult>();

  if (error || !data) {
    console.error("Barber shop claim review failed", {
      claimId,
      decision,
      message: error?.message ?? "missing result",
    });
    redirectWithParams({ error: "店舗管理申請を処理できませんでした。状態が更新済みでないか確認してください。" });
  }

  revalidatePath("/admin/barber-shops/claims");
  revalidatePath("/mypage");
  revalidatePath(`/stores/${data.shop_id}`);

  redirectWithParams(decision === "approve" ? { approved: "1" } : { rejected: "1" });
}
