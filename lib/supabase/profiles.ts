import type { SupabaseClient } from "@supabase/supabase-js";

export type AccountProfile = {
  id: string;
  display_name: string | null;
  job_type: string | null;
  salon_name: string | null;
  region: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  shop_address: string | null;
  shop_map_url: string | null;
  website_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  x_url: string | null;
  line_url: string | null;
  hotpepper_url: string | null;
  rakuten_url: string | null;
  booking_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const profileBaseSelect = "id, display_name, job_type, salon_name, region, bio, avatar_url, cover_url, created_at, updated_at";
const profileLegacySelect = "id, display_name, job_type, salon_name, region, bio, avatar_url, created_at, updated_at";
const profileLinkSelect = "shop_address, shop_map_url, website_url, instagram_url, youtube_url, tiktok_url, x_url, line_url, hotpepper_url, rakuten_url, booking_url";

export const profileSelect = `${profileBaseSelect}, ${profileLinkSelect}`;

const emptyProfileLinks = {
  shop_address: null,
  shop_map_url: null,
  website_url: null,
  instagram_url: null,
  youtube_url: null,
  tiktok_url: null,
  x_url: null,
  line_url: null,
  hotpepper_url: null,
  rakuten_url: null,
  booking_url: null,
};

function withMissingProfileLinks<T extends Omit<AccountProfile, keyof typeof emptyProfileLinks>>(profile: T | null) {
  return profile ? ({ ...profile, ...emptyProfileLinks } as AccountProfile) : null;
}

export async function getAccountProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(profileSelect)
    .eq("id", userId)
    .maybeSingle<AccountProfile>();

  if (error) {
    const base = await supabase
      .from("profiles")
      .select(profileBaseSelect)
      .eq("id", userId)
      .maybeSingle<Omit<AccountProfile, keyof typeof emptyProfileLinks>>();

    if (!base.error) {
      return {
        profile: withMissingProfileLinks(base.data),
        error: null,
      };
    }

    const legacy = await supabase
      .from("profiles")
      .select(profileLegacySelect)
      .eq("id", userId)
      .maybeSingle<Omit<AccountProfile, "cover_url" | keyof typeof emptyProfileLinks>>();

    return {
      profile: legacy.data ? { ...legacy.data, cover_url: null, ...emptyProfileLinks } : null,
      error: legacy.error,
    };
  }

  return { profile: data, error };
}
