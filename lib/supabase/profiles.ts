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
  created_at: string | null;
  updated_at: string | null;
};

export const profileSelect = "id, display_name, job_type, salon_name, region, bio, avatar_url, cover_url, created_at, updated_at";

export async function getAccountProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(profileSelect)
    .eq("id", userId)
    .maybeSingle<AccountProfile>();

  if (error && error.message.toLowerCase().includes("cover_url")) {
    const legacySelect = "id, display_name, job_type, salon_name, region, bio, avatar_url, created_at, updated_at";
    const legacy = await supabase
      .from("profiles")
      .select(legacySelect)
      .eq("id", userId)
      .maybeSingle<Omit<AccountProfile, "cover_url">>();

    return {
      profile: legacy.data ? { ...legacy.data, cover_url: null } : null,
      error: legacy.error,
    };
  }

  return { profile: data, error };
}
