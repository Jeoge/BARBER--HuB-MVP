"use server";

import { redirect } from "next/navigation";
import { pathWithParams, safeNextPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

export async function openBarberHubAfterConfirmation(formData: FormData) {
  const next = safeNextPath(formData.get("next"), "/");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      pathWithParams("/login", {
        next,
        message: "ログイン状態を確認できませんでした。メール確認済みの場合はログインしてBARBER HUBを開いてください。",
      })
    );
  }

  redirect(next);
}
