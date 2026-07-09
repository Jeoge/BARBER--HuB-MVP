"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { hasSafetyConfirmations, SAFETY_CONFIRMATION_ERROR, safetyMigrationErrorMessage } from "@/lib/safety";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

const ADVERTISING_SAFETY_FIELDS = [
  "advertisingTruthConfirmed",
  "advertisingLabelConfirmed",
  "advertisingNoGuaranteeConfirmed",
];

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function cleanNullableText(value: FormDataEntryValue | null) {
  const text = cleanText(value);
  return text.length > 0 ? text : null;
}

function cleanUrl(value: FormDataEntryValue | null) {
  const text = cleanNullableText(value);
  if (text == null) return null;

  const candidate = /^https?:\/\//i.test(text) ? text : `https://${text}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function redirectToApply(error: string): never {
  redirect(pathWithParams("/advertising/apply", { error }));
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return String(error || "");
}

function saveErrorMessage(error: unknown) {
  const message = errorMessage(error).toLowerCase();

  if (message.includes("relation") && message.includes("advertising_inquiries")) {
    return "問い合わせを保存できませんでした。時間をおいて再度お試しください。";
  }

  if (message.includes("row-level security") || message.includes("permission") || message.includes("unauthorized")) {
    return "問い合わせを保存できませんでした。時間をおいて再度お試しください。";
  }

  if (message.includes("safety_confirmed_at") || message.includes("guidelines_confirmed") || message.includes("pr_disclosure_checked")) {
    return safetyMigrationErrorMessage("広告・協賛問い合わせ");
  }

  return "問い合わせを保存できませんでした。入力内容を確認して、もう一度お試しください。";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function createAdvertisingInquiryAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Advertising inquiry auth lookup failed", {
        message: userError.message,
      });
    }

    redirect(pathWithParams("/login", { next: "/advertising/apply", message: "広告・協賛問い合わせにはログインしてください。" }));
  }

  const { profile, error: profileError } = await getAccountProfile(supabase, user.id);

  if (profileError) {
    console.error("Advertising inquiry profile lookup failed", {
      userId: user.id,
      message: profileError.message,
    });
  }

  const organizationName = cleanText(formData.get("organizationName"));
  const contactName = cleanText(formData.get("contactName"));
  const email = cleanText(formData.get("email")) || user.email || "";
  const accountType = cleanNullableText(formData.get("accountType")) ?? profile?.job_type ?? null;
  const inquiryType = cleanText(formData.get("inquiryType"));
  const contentSummary = cleanText(formData.get("contentSummary"));
  const purpose = cleanNullableText(formData.get("purpose"));

  if (!organizationName) {
    redirectToApply("会社名・団体名を入力してください。");
  }

  if (!contactName) {
    redirectToApply("担当者名を入力してください。");
  }

  if (!isValidEmail(email)) {
    redirectToApply("メールアドレスの形式を確認してください。");
  }

  if (!inquiryType) {
    redirectToApply("問い合わせ種別を選択してください。");
  }

  if (!contentSummary) {
    redirectToApply("掲載したい内容を入力してください。");
  }

  if (!hasSafetyConfirmations(formData, ADVERTISING_SAFETY_FIELDS)) {
    redirectToApply(SAFETY_CONFIRMATION_ERROR);
  }

  const now = new Date().toISOString();
  const id = randomUUID();
  const { data, error } = await supabase
    .from("advertising_inquiries")
    .insert({
      id,
      user_id: user.id,
      organization_name: organizationName,
      contact_name: contactName,
      email,
      account_type: accountType,
      inquiry_type: inquiryType,
      content_summary: contentSummary,
      purpose,
      desired_timing: cleanNullableText(formData.get("desiredTiming")),
      budget_range: cleanNullableText(formData.get("budgetRange")),
      website_url: cleanUrl(formData.get("websiteUrl")),
      note: cleanNullableText(formData.get("note")),
      status: "new",
      safety_confirmed_at: now,
      guidelines_confirmed: true,
      pr_disclosure_checked: true,
      created_at: now,
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    console.error("Advertising inquiry insert failed", {
      userId: user.id,
      message: error.message,
    });
    redirectToApply(saveErrorMessage(error));
  }

  if (data?.id !== id) {
    redirectToApply("問い合わせを保存できませんでした。もう一度お試しください。");
  }

  revalidatePath("/advertising");
  redirect(pathWithParams("/advertising", { inquiry: "sent" }));
}
