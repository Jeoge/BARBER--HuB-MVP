import "server-only";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type BarberHubAdminUser = {
  id: string;
};

export function configuredBarberHubAdminIds() {
  const primary = process.env.BARBER_HUB_ADMIN_USER_IDS ?? "";
  const legacy = process.env.NEWS_REVIEW_ADMIN_USER_IDS ?? "";

  return `${primary},${legacy}`
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function isBarberHubAdminUserId(userId: string | null | undefined) {
  if (!userId) return false;
  return configuredBarberHubAdminIds().includes(userId);
}

export async function requireBarberHubAdmin(): Promise<BarberHubAdminUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isBarberHubAdminUserId(user.id)) {
    notFound();
  }

  return { id: user.id };
}
