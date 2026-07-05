"use server";

import { redirect } from "next/navigation";
import { authErrorMessage } from "@/lib/auth/messages";
import { pathWithParams, safeNextPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

function redirectToLogin(params: { error?: string; message?: string; next?: string }) {
  redirect(pathWithParams("/login", params));
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"), "/mypage");

  if (!email || !password) {
    redirectToLogin({ error: "メールアドレスとパスワードを入力してください。", next });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirectToLogin({ error: authErrorMessage(error.message), next });
  }

  redirect(next);
}
