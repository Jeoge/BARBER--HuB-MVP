"use server";

import { redirect } from "next/navigation";
import { pathWithParams } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(pathWithParams("/login", { message: "ログアウトしました。" }));
}
