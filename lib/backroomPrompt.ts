import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getBackroomProfile } from "@/lib/supabase/backroom";

export type BackRoomPromptState = "login" | "setup" | "joined" | "unavailable";

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  if (error instanceof Error) return error.message;
  return String(error || "");
}

function isUnavailableBackroomError(error: unknown) {
  const message = errorMessage(error).toLowerCase();
  return message.includes("backroom_profiles") || message.includes("schema cache") || message.includes("relation");
}

export async function getBackRoomPromptState(supabase: SupabaseClient, userId: string | null | undefined): Promise<BackRoomPromptState> {
  if (!userId) return "login";

  const { profile, error } = await getBackroomProfile(supabase, userId);
  if (profile != null) return "joined";
  if (error && isUnavailableBackroomError(error)) return "unavailable";
  return "setup";
}
