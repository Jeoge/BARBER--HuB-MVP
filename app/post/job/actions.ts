"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { getPostPermissionRedirect } from "@/lib/permissions";
import { hasSafetyConfirmations, SAFETY_CONFIRMATION_ERROR, safetyMigrationErrorMessage } from "@/lib/safety";
import { isSalonJobPosterProfile } from "@/lib/supabase/jobs";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

type JobFormMode = "create" | "update";

const JOB_RELATION_ERROR =
  "求人を保存できませんでした。時間をおいて再度お試しください。";
const JOB_SAFETY_FIELDS = ["jobFactsConfirmed", "jobDirectContactConfirmed", "jobNoGuaranteeConfirmed"];

function cleanText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function cleanNullableText(value: FormDataEntryValue | null) {
  const text = cleanText(value);
  return text.length > 0 ? text : null;
}

function uniqueFormValues(values: FormDataEntryValue[]) {
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0)
    )
  );
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

function cleanImageUrl(value: FormDataEntryValue | null) {
  const text = cleanNullableText(value);
  if (text == null) return null;
  if (text.startsWith("/")) return text;
  return cleanUrl(text);
}

function validStatus(value: string) {
  return value === "draft" || value === "published" || value === "closed" ? value : "published";
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

  if (message.includes("relation") && message.includes("job_posts")) {
    return JOB_RELATION_ERROR;
  }

  if (message.includes("foreign key")) {
    return "プロフィール設定後に求人掲載できます。先に店舗情報を保存してください。";
  }

  if (message.includes("row-level security") || message.includes("permission") || message.includes("unauthorized")) {
    return "求人を保存できませんでした。店舗情報を確認して、もう一度お試しください。";
  }

  if (message.includes("safety_confirmed_at") || message.includes("guidelines_confirmed") || message.includes("pr_disclosure_checked")) {
    return safetyMigrationErrorMessage("求人");
  }

  return "求人を保存できませんでした。入力内容を確認して、もう一度お試しください。";
}

function redirectToJobForm(path: string, error: string): never {
  redirect(pathWithParams(path, { error }));
}

function requireText(value: string, path: string, message: string) {
  if (!value) redirectToJobForm(path, message);
  return value;
}

function parseJobPayload(formData: FormData, userId: string, redirectPath: string) {
  const salonName = requireText(cleanText(formData.get("salonName")), redirectPath, "サロン名を入力してください。");
  const address = requireText(cleanText(formData.get("address")), redirectPath, "店舗所在地を入力してください。");
  const prefecture = requireText(cleanText(formData.get("prefecture")), redirectPath, "都道府県を入力してください。");
  const city = requireText(cleanText(formData.get("city")), redirectPath, "市区町村を入力してください。");
  const jobTitles = uniqueFormValues(formData.getAll("jobTitle"));
  const employmentTypes = uniqueFormValues(formData.getAll("employmentType"));
  const description = requireText(cleanText(formData.get("description")), redirectPath, "仕事内容を入力してください。");
  const salary = requireText(cleanText(formData.get("salary")), redirectPath, "給与を入力してください。");
  const workingHours = requireText(cleanText(formData.get("workingHours")), redirectPath, "勤務時間を入力してください。");
  const holidays = requireText(cleanText(formData.get("holidays")), redirectPath, "休日を入力してください。");
  const applicationMethod = requireText(cleanText(formData.get("applicationMethod")), redirectPath, "応募・見学方法を入力してください。");

  if (!hasSafetyConfirmations(formData, JOB_SAFETY_FIELDS)) {
    redirectToJobForm(redirectPath, SAFETY_CONFIRMATION_ERROR);
  }

  if (jobTitles.length === 0) {
    redirectToJobForm(redirectPath, "募集職種を1つ以上選択してください。");
  }

  if (employmentTypes.length === 0) {
    redirectToJobForm(redirectPath, "雇用形態を1つ以上選択してください。");
  }

  const contactPhone = cleanNullableText(formData.get("contactPhone"));
  const contactEmail = cleanNullableText(formData.get("contactEmail"));
  const websiteUrl = cleanUrl(formData.get("websiteUrl"));
  const instagramUrl = cleanUrl(formData.get("instagramUrl"));
  const lineUrl = cleanUrl(formData.get("lineUrl"));
  const applicationUrl = cleanUrl(formData.get("applicationUrl"));

  if (!contactPhone && !contactEmail && !websiteUrl && !instagramUrl && !lineUrl && !applicationUrl) {
    redirectToJobForm(redirectPath, "電話・メール・公式サイト・SNS・見学リンクのいずれかを入力してください。");
  }

  return {
    user_id: userId,
    salon_name: salonName,
    employer_name: cleanNullableText(formData.get("employerName")),
    address,
    prefecture,
    city,
    station: cleanNullableText(formData.get("station")),
    image_url: cleanImageUrl(formData.get("imageUrl")),
    job_title: jobTitles.join(" / "),
    employment_type: employmentTypes.join(" / "),
    description,
    pr_message: cleanNullableText(formData.get("prMessage")),
    salary,
    working_hours: workingHours,
    holidays,
    benefits: cleanNullableText(formData.get("benefits")),
    trial_period: cleanNullableText(formData.get("trialPeriod")),
    application_method: applicationMethod,
    tags: uniqueFormValues(formData.getAll("tags")).slice(0, 16),
    contact_phone: contactPhone,
    contact_email: contactEmail,
    website_url: websiteUrl,
    instagram_url: instagramUrl,
    line_url: lineUrl,
    application_url: applicationUrl,
    visit_available: cleanText(formData.get("visitAvailable")) !== "false",
    status: validStatus(cleanText(formData.get("status"))),
    is_paid_featured: false,
    is_deleted: false,
    sort_priority: 0,
    plan_type: "free",
    safety_confirmed_at: new Date().toISOString(),
    guidelines_confirmed: true,
    pr_disclosure_checked: false,
  };
}

async function requireJobPoster(redirectPath: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Job post auth lookup failed", { message: userError.message });
    }

    redirect(pathWithParams("/login", { next: redirectPath, message: "求人掲載にはログインしてください。" }));
  }

  const { profile, error: profileError } = await getAccountProfile(supabase, user.id);

  if (profileError) {
    console.error("Job post profile lookup failed", {
      userId: user.id,
      message: profileError.message,
    });
    redirectToJobForm(redirectPath, "プロフィール情報を確認できませんでした。時間をおいて再度お試しください。");
  }

  const permissionRedirect = getPostPermissionRedirect(profile, "job", redirectPath);
  if (permissionRedirect) {
    redirect(permissionRedirect);
  }

  if (profile == null || !isSalonJobPosterProfile(profile)) {
    redirectToJobForm(redirectPath, "求人掲載には店舗情報の登録が必要です。まずはマイページで店舗情報を登録してください。");
  }

  return { supabase, user };
}

async function saveJobPost(formData: FormData, mode: JobFormMode) {
  const jobId = cleanText(formData.get("jobId"));
  const redirectPath = mode === "update" && jobId ? `/mypage/jobs/${jobId}/edit` : "/post/job";
  const { supabase, user } = await requireJobPoster(redirectPath);
  const payload = parseJobPayload(formData, user.id, redirectPath);
  const now = new Date().toISOString();

  if (mode === "create") {
    const id = randomUUID();
    const { data, error } = await supabase
      .from("job_posts")
      .insert({
        id,
        ...payload,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error) {
      console.error("Job post insert failed", {
        userId: user.id,
        message: error.message,
      });
      redirectToJobForm(redirectPath, saveErrorMessage(error));
    }

    if (data?.id !== id) {
      redirectToJobForm(redirectPath, "求人を保存できませんでした。もう一度お試しください。");
    }

    revalidatePath("/jobs");
    revalidatePath("/mypage");
    revalidatePath(`/profiles/${user.id}`);
    revalidatePath(`/jobs/${id}`);
    redirect(pathWithParams(`/jobs/${id}`, { posted: "1" }));
  }

  if (!jobId) {
    redirectToJobForm("/mypage", "求人IDを確認できませんでした。");
  }

  const { error } = await supabase
    .from("job_posts")
    .update({
      ...payload,
      updated_at: now,
    })
    .eq("id", jobId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Job post update failed", {
      userId: user.id,
      jobId,
      message: error.message,
    });
    redirectToJobForm(redirectPath, saveErrorMessage(error));
  }

  revalidatePath("/jobs");
  revalidatePath("/mypage");
  revalidatePath(`/profiles/${user.id}`);
  revalidatePath(`/jobs/${jobId}`);
  redirect(payload.status === "published" ? pathWithParams(`/jobs/${jobId}`, { updated: "1" }) : pathWithParams("/mypage", { job: "updated" }));
}

export async function createJobPostAction(formData: FormData) {
  await saveJobPost(formData, "create");
}

export async function updateJobPostAction(formData: FormData) {
  await saveJobPost(formData, "update");
}

export async function closeJobPostAction(formData: FormData) {
  const jobId = cleanText(formData.get("jobId"));
  const redirectPath = "/mypage";

  if (!jobId) {
    redirectToJobForm(redirectPath, "求人IDを確認できませんでした。");
  }

  const { supabase, user } = await requireJobPoster(redirectPath);
  const { error } = await supabase
    .from("job_posts")
    .update({ status: "closed", updated_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Job post close failed", {
      userId: user.id,
      jobId,
      message: error.message,
    });
    redirectToJobForm(redirectPath, saveErrorMessage(error));
  }

  revalidatePath("/jobs");
  revalidatePath("/mypage");
  revalidatePath(`/jobs/${jobId}`);
  redirect(pathWithParams("/mypage", { job: "closed" }));
}
