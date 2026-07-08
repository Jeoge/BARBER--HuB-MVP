import type { SupabaseClient } from "@supabase/supabase-js";
import { SUCCESSION_FALLBACK_IMAGE } from "@/lib/succession";

export type SuccessionPostStatus = "draft" | "published" | "closed";

export type SuccessionPublicPost = {
  id: string;
  user_id: string;
  listing_type: string;
  title: string;
  public_description: string;
  prefecture: string | null;
  city: string | null;
  area: string | null;
  business_type: string | null;
  seats_count: number | null;
  shampoo_count: number | null;
  years_open: string | null;
  desired_timing: string | null;
  public_image_url: string | null;
  contact_method: string | null;
  status: SuccessionPostStatus;
  is_deleted: boolean;
  is_paid_featured: boolean;
  sort_priority: number;
  plan_type: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type SuccessionPrivatePost = {
  post_id: string;
  user_id: string;
  private_shop_name: string | null;
  private_address: string | null;
  private_price: string | null;
  private_rent: string | null;
  private_sales_note: string | null;
  private_owner_contact: string | null;
  private_borrowing_note: string | null;
  private_customer_count_note: string | null;
  private_staff_note: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type SuccessionOwnerPost = SuccessionPublicPost & {
  private: SuccessionPrivatePost | null;
};

const publicSuccessionSelect = `
  id,
  user_id,
  listing_type,
  title,
  public_description,
  prefecture,
  city,
  area,
  business_type,
  seats_count,
  shampoo_count,
  years_open,
  desired_timing,
  public_image_url,
  contact_method,
  status,
  is_deleted,
  is_paid_featured,
  sort_priority,
  plan_type,
  created_at,
  updated_at
`;

const privateSuccessionSelect = `
  post_id,
  user_id,
  private_shop_name,
  private_address,
  private_price,
  private_rent,
  private_sales_note,
  private_owner_contact,
  private_borrowing_note,
  private_customer_count_note,
  private_staff_note,
  created_at,
  updated_at
`;

function normalizePublicPost(row: SuccessionPublicPost): SuccessionPublicPost {
  return {
    ...row,
    public_image_url: row.public_image_url?.trim() || SUCCESSION_FALLBACK_IMAGE,
    status: (["draft", "published", "closed"].includes(row.status) ? row.status : "published") as SuccessionPostStatus,
    is_deleted: row.is_deleted ?? false,
    is_paid_featured: row.is_paid_featured ?? false,
    sort_priority: row.sort_priority ?? 0,
  };
}

function text(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

export async function listPublishedSuccessionPosts(supabase: SupabaseClient, limit = 100) {
  const { data, error } = await supabase
    .from("succession_posts")
    .select(publicSuccessionSelect)
    .eq("status", "published")
    .eq("is_deleted", false)
    .order("is_paid_featured", { ascending: false })
    .order("sort_priority", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<SuccessionPublicPost[]>();

  return {
    posts: (data ?? []).map(normalizePublicPost),
    error,
  };
}

export async function getPublishedSuccessionPost(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("succession_posts")
    .select(publicSuccessionSelect)
    .eq("id", id)
    .eq("status", "published")
    .eq("is_deleted", false)
    .maybeSingle<SuccessionPublicPost>();

  return {
    post: data ? normalizePublicPost(data) : null,
    error,
  };
}

export async function listUserSuccessionPosts(supabase: SupabaseClient, userId: string, limit = 30) {
  const { data, error } = await supabase
    .from("succession_posts")
    .select(publicSuccessionSelect)
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<SuccessionPublicPost[]>();

  return {
    posts: (data ?? []).map(normalizePublicPost),
    error,
  };
}

export async function getUserSuccessionPost(supabase: SupabaseClient, userId: string, id: string) {
  const { data, error } = await supabase
    .from("succession_posts")
    .select(publicSuccessionSelect)
    .eq("id", id)
    .eq("user_id", userId)
    .eq("is_deleted", false)
    .maybeSingle<SuccessionPublicPost>();

  if (error || data == null) {
    return {
      post: data ? ({ ...normalizePublicPost(data), private: null } as SuccessionOwnerPost) : null,
      error,
    };
  }

  const privateResult = await supabase
    .from("succession_post_private")
    .select(privateSuccessionSelect)
    .eq("post_id", id)
    .eq("user_id", userId)
    .maybeSingle<SuccessionPrivatePost>();

  return {
    post: { ...normalizePublicPost(data), private: privateResult.data ?? null } as SuccessionOwnerPost,
    error: privateResult.error,
  };
}

export function successionStatusLabel(status: SuccessionPostStatus | string | null | undefined) {
  if (status === "draft") return "下書き";
  if (status === "closed") return "停止中";
  return "公開中";
}

export function successionAreaLabel(post: Pick<SuccessionPublicPost, "prefecture" | "city" | "area">) {
  return [text(post.prefecture), text(post.city), text(post.area)].filter(Boolean).join(" / ") || "地域未設定";
}

export function successionSpecs(post: Pick<SuccessionPublicPost, "business_type" | "seats_count" | "shampoo_count" | "years_open" | "desired_timing">) {
  return [
    text(post.business_type),
    post.seats_count != null ? `席数 ${post.seats_count}` : null,
    post.shampoo_count != null ? `シャンプー台 ${post.shampoo_count}` : null,
    text(post.years_open) ? `営業 ${post.years_open}` : null,
    text(post.desired_timing) ? `時期 ${post.desired_timing}` : null,
  ].filter((value): value is string => Boolean(value));
}
