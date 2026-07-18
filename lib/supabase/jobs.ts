import type { SupabaseClient } from "@supabase/supabase-js";
import { JOB_FALLBACK_IMAGE } from "@/lib/jobs";
import type { AccountProfile } from "./profiles";

export type JobPostStatus = "draft" | "published" | "closed";

export type JobPost = {
  id: string;
  user_id: string;
  salon_name: string;
  employer_name: string | null;
  address: string | null;
  prefecture: string | null;
  city: string | null;
  station: string | null;
  image_url: string | null;
  job_title: string;
  employment_type: string | null;
  description: string | null;
  pr_message: string | null;
  salary: string | null;
  working_hours: string | null;
  holidays: string | null;
  benefits: string | null;
  trial_period: string | null;
  application_method: string | null;
  tags: string[];
  contact_phone: string | null;
  contact_email: string | null;
  website_url: string | null;
  instagram_url: string | null;
  line_url: string | null;
  application_url: string | null;
  visit_available: boolean;
  status: JobPostStatus;
  is_paid_featured: boolean;
  is_deleted: boolean;
  featured_until: string | null;
  sort_priority: number;
  plan_type: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type JobContactLink = {
  label: string;
  href: string;
  external?: boolean;
};

const jobPostSelect = `
  id,
  user_id,
  salon_name,
  employer_name,
  address,
  prefecture,
  city,
  station,
  image_url,
  job_title,
  employment_type,
  description,
  pr_message,
  salary,
  working_hours,
  holidays,
  benefits,
  trial_period,
  application_method,
  tags,
  contact_phone,
  contact_email,
  website_url,
  instagram_url,
  line_url,
  application_url,
  visit_available,
  status,
  is_paid_featured,
  is_deleted,
  featured_until,
  sort_priority,
  plan_type,
  created_at,
  updated_at
`;

function normalizeJobPost(row: JobPost): JobPost {
  return {
    ...row,
    tags: Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === "string") : [],
    image_url: row.image_url?.trim() || JOB_FALLBACK_IMAGE,
    status: (["draft", "published", "closed"].includes(row.status) ? row.status : "published") as JobPostStatus,
    visit_available: row.visit_available ?? true,
    is_paid_featured: row.is_paid_featured ?? false,
    is_deleted: row.is_deleted ?? false,
    sort_priority: row.sort_priority ?? 0,
  };
}

function text(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function encodedMailto(email: string, salonName: string) {
  const subject = encodeURIComponent(`BARBER HUBの求人について: ${salonName}`);
  return `mailto:${email}?subject=${subject}`;
}

export async function listPublishedJobPosts(supabase: SupabaseClient, limit = 100) {
  const { data, error } = await supabase
    .from("job_posts")
    .select(jobPostSelect)
    .eq("status", "published")
    .eq("is_deleted", false)
    .order("is_paid_featured", { ascending: false })
    .order("sort_priority", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<JobPost[]>();

  return {
    jobs: (data ?? []).map(normalizeJobPost),
    error,
  };
}

export async function getPublishedJobPost(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("job_posts")
    .select(jobPostSelect)
    .eq("id", id)
    .eq("status", "published")
    .eq("is_deleted", false)
    .maybeSingle<JobPost>();

  return {
    job: data ? normalizeJobPost(data) : null,
    error,
  };
}

export async function listUserJobPosts(supabase: SupabaseClient, userId: string, limit = 30) {
  const { data, error } = await supabase
    .from("job_posts")
    .select(jobPostSelect)
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<JobPost[]>();

  return {
    jobs: (data ?? []).map(normalizeJobPost),
    error,
  };
}

export async function getUserJobPost(supabase: SupabaseClient, userId: string, id: string) {
  const { data, error } = await supabase
    .from("job_posts")
    .select(jobPostSelect)
    .eq("id", id)
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .maybeSingle<JobPost>();

  return {
    job: data ? normalizeJobPost(data) : null,
    error,
  };
}

export function jobStatusLabel(status: JobPostStatus | string | null | undefined) {
  if (status === "draft") return "下書き";
  if (status === "closed") return "停止中";
  return "掲載中";
}

export function jobAreaLabel(job: Pick<JobPost, "prefecture" | "city" | "station">) {
  return [text(job.prefecture), text(job.city), text(job.station)].filter(Boolean).join(" / ") || "地域未設定";
}

export function jobCardDescription(job: Pick<JobPost, "pr_message" | "description">) {
  return text(job.pr_message) ?? text(job.description) ?? "サロンの募集情報を掲載中です。";
}

export function jobContactLinks(job: Pick<JobPost, "salon_name" | "application_url" | "contact_phone" | "contact_email" | "website_url" | "instagram_url" | "line_url">) {
  const links: JobContactLink[] = [];

  if (text(job.application_url)) {
    links.push({ label: "見学・応募リンク", href: text(job.application_url)!, external: true });
  }

  if (text(job.contact_phone)) {
    links.push({ label: "電話で連絡する", href: `tel:${text(job.contact_phone)}` });
  }

  if (text(job.contact_email)) {
    links.push({ label: "メールで連絡する", href: encodedMailto(text(job.contact_email)!, job.salon_name) });
  }

  if (text(job.website_url)) {
    links.push({ label: "公式サイトを見る", href: text(job.website_url)!, external: true });
  }

  if (text(job.instagram_url)) {
    links.push({ label: "Instagramを見る", href: text(job.instagram_url)!, external: true });
  }

  if (text(job.line_url)) {
    links.push({ label: "LINE公式を見る", href: text(job.line_url)!, external: true });
  }

  return links;
}

export function isExternalContactHref(href: string) {
  return /^https?:\/\//i.test(href);
}
