import "server-only";

import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdminConfigStatus() {
  const missing: string[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  return {
    ready: missing.length === 0,
    missing,
  };
}

export function createSupabaseAdminClient() {
  const status = getSupabaseAdminConfigStatus();

  if (!status.ready) {
    throw new Error(`Missing server Supabase configuration: ${status.missing.join(", ")}`);
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
