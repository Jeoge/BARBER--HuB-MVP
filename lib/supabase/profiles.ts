import type { SupabaseClient } from "@supabase/supabase-js";

export type AccountProfile = {
  id: string;
  display_name: string | null;
  job_type: string | null;
  salon_name: string | null;
  region: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export const profileSelect = "id, display_name, job_type, salon_name, region, bio, avatar_url, created_at, updated_at";

export async function getAccountProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(profileSelect)
    .eq("id", userId)
    .maybeSingle<AccountProfile>();

  return { profile: data, error };
}
