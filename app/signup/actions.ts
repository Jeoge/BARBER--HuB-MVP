"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authErrorMessage } from "@/lib/auth/messages";
import { pathWithParams, safeNextPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

function redirectToSignup(params: { error?: string; message?: string; next?: string }) {
  redirect(pathWithParams("/signup", params));
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"), "/mypage");

  if (!email || !password) {
    redirectToSignup({ error: "メールアドレスとパスワードを入力してください。", next });
  }

  if (password.length < 6) {
    redirectToSignup({ error: "パスワードは6文字以上で入力してください。", next });
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    redirectToSignup({ error: authErrorMessage(error.message, "signup"), next });
  }

  redirectToSignup({
    message: "signup-sent",
    next,
  });
}
