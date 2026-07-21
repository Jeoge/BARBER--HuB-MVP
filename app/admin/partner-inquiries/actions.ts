"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBarberHubAdmin } from "@/lib/admin/permissions";
import { PARTNER_INQUIRY_STATUSES } from "@/lib/admin/partner-inquiries";
import { createSupabaseAdminClient, getSupabaseAdminConfigStatus } from "@/lib/supabase/admin";

function cleanText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function redirectWithError(message: string): never {
  redirect(`/admin/partner-inquiries?error=${encodeURIComponent(message)}`);
}

export async function updatePartnerInquiryAction(formData: FormData) {
  const admin = await requireBarberHubAdmin();
  const inquiryId = cleanText(formData.get("inquiryId"));
  const status = cleanText(formData.get("status"));
  const adminNote = cleanText(formData.get("adminNote"));

  if (!isUuid(inquiryId) || !PARTNER_INQUIRY_STATUSES.includes(status as (typeof PARTNER_INQUIRY_STATUSES)[number])) {
    redirectWithError("問い合わせの更新内容を確認できませんでした。");
  }

  if (adminNote.length > 5000) {
    redirectWithError("管理者メモは5000文字以内で入力してください。");
  }

  const config = getSupabaseAdminConfigStatus();
  if (!config.ready) {
    redirectWithError("管理画面用のSupabase設定が不足しています。");
  }

  const { error } = await createSupabaseAdminClient()
    .from("partner_inquiries")
    .update({
      status,
      admin_note: adminNote || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
    })
    .eq("id", inquiryId);

  if (error) {
    console.error("Partner inquiry update failed", { inquiryId, status, code: error.code ?? "unknown" });
    redirectWithError("問い合わせを更新できませんでした。時間をおいて再度お試しください。");
  }

  revalidatePath("/admin/partner-inquiries");
  revalidatePath(`/admin/partner-inquiries/${inquiryId}`);
  redirect(`/admin/partner-inquiries/${inquiryId}?updated=1`);
}
