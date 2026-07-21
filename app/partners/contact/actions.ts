"use server";

import { createHash, randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient, getSupabaseAdminConfigStatus } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const PARTNER_INQUIRY_TYPES = new Set([
  "協賛について",
  "広告掲載について",
  "タイアップ・共同企画について",
  "その他",
]);

const RECENT_SUBMISSION_WINDOW_MS = 10 * 60 * 1000;
const RECENT_SUBMISSION_LIMIT = 3;
const LOCAL_DUPLICATE_WINDOW_MS = 30 * 1000;
const recentSubmissionByEmailHash = new Map<string, number>();

function cleanText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function hasLineBreak(value: string) {
  return /[\r\n]/.test(value);
}

function redirectWithError(message: string): never {
  redirect(`/partners/contact?error=${encodeURIComponent(message)}`);
}

function genericSaveError(): never {
  redirectWithError("お問い合わせを送信できませんでした。時間をおいて再度お試しください。");
}

function isValidEmail(value: string) {
  return value.length <= 254 && !hasLineBreak(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseWebsiteUrl(value: string) {
  if (!value) return null;
  if (value.length > 500 || hasLineBreak(value) || !/^https?:\/\//i.test(value)) return undefined;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export async function createPartnerInquiryAction(formData: FormData) {
  const honeypot = cleanText(formData.get("website")).slice(0, 200);
  if (honeypot) {
    redirect("/partners/contact?submitted=1");
  }

  const contactName = cleanText(formData.get("contactName"));
  const organizationName = cleanText(formData.get("organizationName"));
  const rawEmailValue = formData.get("email");
  const rawEmail = typeof rawEmailValue === "string" ? rawEmailValue.trim() : "";
  if (typeof rawEmailValue !== "string" || hasLineBreak(rawEmailValue)) {
    redirectWithError("メールアドレスの形式を確認してください。");
  }
  const email = rawEmail.toLowerCase();
  const phone = cleanText(formData.get("phone"));
  const websiteInput = cleanText(formData.get("websiteUrl"));
  const inquiryType = cleanText(formData.get("inquiryType"));
  const message = cleanText(formData.get("message"));
  const privacyConsent = formData.get("privacyConsent") === "on";

  if (!contactName || contactName.length > 100 || hasLineBreak(contactName)) {
    redirectWithError("お名前を確認してください。");
  }

  if (organizationName.length > 160 || hasLineBreak(organizationName)) {
    redirectWithError("会社名・団体名は160文字以内で入力してください。");
  }

  if (!isValidEmail(email)) {
    redirectWithError("メールアドレスの形式を確認してください。");
  }

  if (phone.length > 50 || hasLineBreak(phone)) {
    redirectWithError("電話番号は50文字以内で入力してください。");
  }

  const websiteUrl = parseWebsiteUrl(websiteInput);
  if (websiteInput && websiteUrl === undefined) {
    redirectWithError("WebサイトURLはhttp://またはhttps://から始まるURLを入力してください。");
  }

  if (inquiryType && !PARTNER_INQUIRY_TYPES.has(inquiryType)) {
    redirectWithError("お問い合わせ種別を確認してください。");
  }

  if (message.length < 20 || message.length > 5000) {
    redirectWithError("お問い合わせ内容は20〜5000文字で入力してください。");
  }

  if (!privacyConsent) {
    redirectWithError("プライバシーポリシーへの同意が必要です。");
  }

  const emailHash = createHash("sha256").update(email).digest("hex");
  const now = Date.now();
  const lastLocalSubmission = recentSubmissionByEmailHash.get(emailHash);
  if (lastLocalSubmission && now - lastLocalSubmission < LOCAL_DUPLICATE_WINDOW_MS) {
    redirectWithError("短時間に続けて送信できません。時間をおいて再度お試しください。");
  }

  const config = getSupabaseAdminConfigStatus();
  if (!config.ready) {
    console.error("Partner inquiry configuration is incomplete", { missingCount: config.missing.length });
    genericSaveError();
  }

  const adminSupabase = createSupabaseAdminClient();
  const since = new Date(now - RECENT_SUBMISSION_WINDOW_MS).toISOString();
  const { count, error: rateLimitError } = await adminSupabase
    .from("partner_inquiries")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", since);

  if (rateLimitError) {
    console.error("Partner inquiry rate limit lookup failed", { code: rateLimitError.code ?? "unknown" });
    genericSaveError();
  }

  if ((count ?? 0) >= RECENT_SUBMISSION_LIMIT) {
    redirectWithError("短時間に続けて送信できません。時間をおいて再度お試しください。");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const id = randomUUID();
  const { error } = await adminSupabase.from("partner_inquiries").insert({
    id,
    inquiry_type: inquiryType || null,
    contact_name: contactName,
    organization_name: organizationName || null,
    email,
    phone: phone || null,
    website_url: websiteUrl,
    message,
    status: "new",
    user_id: user?.id ?? null,
    source_page: "/partners/contact",
  });

  if (error) {
    console.error("Partner inquiry insert failed", { code: error.code ?? "unknown" });
    genericSaveError();
  }

  recentSubmissionByEmailHash.set(emailHash, now);
  revalidatePath("/partners/contact");
  redirect("/partners/contact?submitted=1");
}
