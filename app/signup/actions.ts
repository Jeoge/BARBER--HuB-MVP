"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authErrorMessage } from "@/lib/auth/messages";
import { pathWithParams, safeNextPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

function redirectToSignup(params: { error?: string; message?: string; next?: string }) {
  redirect(pathWithParams("/signup", params));
}

function redirectToSignupComplete(params: { status: "check-email" | "maybe-registered"; next?: string }) {
  redirect(pathWithParams("/signup/complete", params));
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"), "/");

  if (!email) {
    redirectToSignup({ error: "メールアドレスを入力してください", next });
  }

  if (!isValidEmail(email)) {
    redirectToSignup({ error: "メールアドレスの形式を確認してください", next });
  }

  if (!password) {
    redirectToSignup({ error: "パスワードを入力してください", next });
  }

  if (password.length < 6) {
    redirectToSignup({ error: "パスワードは6文字以上で入力してください", next });
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    console.error("Supabase signUp failed", {
      message: error.message,
    });
    redirectToSignup({ error: authErrorMessage(error.message, "signup"), next });
  }

  if (Array.isArray(data.user?.identities) && data.user.identities.length === 0) {
    redirectToSignupComplete({
      status: "maybe-registered",
      next,
    });
  }

  redirectToSignupComplete({
    status: "check-email",
    next,
  });
}
