import type { SupabaseClient } from "@supabase/supabase-js";
import type { ArticleTopicSlug } from "@/lib/articleCategories";
import { resolveContentAdImageUrl } from "@/lib/supabase/content-ad-images";

export type ContentAdPlacement =
  | "home"
  | "category_management"
  | "category_marketing"
  | "category_ai"
  | "category_technique"
  | "category_tools"
  | "article_bottom"
  | "backroom";

export type ContentAdTargetMenu = ArticleTopicSlug | "all";

export type ContentAd = {
  id: string;
  advertiser_name: string;
  title: string;
  short_text: string;
  image_url: string | null;
  destination_url: string;
  cta_label: string;
  disclosure_label: "PR" | "広告" | "Sponsored";
  placement: ContentAdPlacement;
  target_menu: ContentAdTargetMenu;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
};

export type ContentAdRecord = ContentAd & {
  image_path: string | null;
};

export const CATEGORY_AD_PLACEMENT_BY_TOPIC: Record<ArticleTopicSlug, ContentAdPlacement> = {
  management: "category_management",
  marketing: "category_marketing",
  ai: "category_ai",
  technique: "category_technique",
  tools: "category_tools",
};

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return String(error || "");
}

function isMissingContentAdsTableError(error: unknown) {
  const message = errorMessage(error).toLowerCase();
  return message.includes("content_ads") || message.includes("schema cache");
}

function isSafeHttpUrl(value: string | null | undefined) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isUsableImageUrl(value: string | null | undefined) {
  if (!value) return false;
  if (value.startsWith("/")) return true;
  return isSafeHttpUrl(value);
}

function isWithinSchedule(ad: Pick<ContentAd, "starts_at" | "ends_at">, now = new Date()) {
  const startsAt = ad.starts_at ? new Date(ad.starts_at) : null;
  const endsAt = ad.ends_at ? new Date(ad.ends_at) : null;

  if (startsAt != null && (Number.isNaN(startsAt.getTime()) || startsAt > now)) return false;
  if (endsAt != null && (Number.isNaN(endsAt.getTime()) || endsAt < now)) return false;
  return true;
}

function normalizeAd(row: ContentAdRecord): ContentAdRecord | null {
  const ad = {
    ...row,
    advertiser_name: row.advertiser_name?.trim(),
    title: row.title?.trim(),
    short_text: row.short_text?.trim(),
    image_path: row.image_path?.trim() || null,
    image_url: row.image_url?.trim() || null,
    destination_url: row.destination_url?.trim(),
    cta_label: row.cta_label?.trim(),
  };

  if (!ad.advertiser_name || !ad.title || !ad.short_text || !ad.cta_label) return null;
  if (!isSafeHttpUrl(ad.destination_url)) return null;
  if (ad.image_url != null && !isUsableImageUrl(ad.image_url)) ad.image_url = null;
  if (!isWithinSchedule(ad)) return null;

  return ad;
}

export async function getActiveContentAd(
  supabase: SupabaseClient,
  placement: ContentAdPlacement,
  targetMenu: ContentAdTargetMenu = "all"
) {
  try {
    const targetMenus = targetMenu === "all" ? ["all"] : ["all", targetMenu];
    const { data, error } = await supabase
      .from("content_ads")
      .select(
        "id, advertiser_name, title, short_text, image_path, image_url, destination_url, cta_label, disclosure_label, placement, target_menu, starts_at, ends_at, is_active, priority, created_at, updated_at"
      )
      .eq("is_active", true)
      .eq("placement", placement)
      .in("target_menu", targetMenus)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<ContentAdRecord[]>();

    if (error) {
      if (!isMissingContentAdsTableError(error)) {
        console.error("Content ad lookup failed", {
          placement,
          targetMenu,
          message: error.message,
        });
      }
      return null;
    }

    const activeAd = (data ?? []).map(normalizeAd).find((ad): ad is ContentAdRecord => ad != null) ?? null;
    return resolveContentAdImageUrl(activeAd);
  } catch (error) {
    if (!isMissingContentAdsTableError(error)) {
      console.error("Content ad lookup threw", {
        placement,
        targetMenu,
        message: errorMessage(error),
      });
    }
    return null;
  }
}
