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
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const area = String(formData.get("area") ?? "").trim();
  const organization = String(formData.get("organization") ?? "").trim();
  const specialty = String(formData.get("specialty") ?? "").trim();
  const memberType = String(formData.get("memberType") ?? "").trim();
  const termsAccepted = formData.get("terms") === "on";
  const next = safeNextPath(formData.get("next"), "/mypage");

  if (!email || !password) {
    redirectToSignup({ error: "メールアドレスとパスワードを入力してください。", next });
  }

  if (password.length < 8) {
    redirectToSignup({ error: "パスワードは8文字以上で入力してください。", next });
  }

  if (!termsAccepted) {
    redirectToSignup({ error: "利用規約に同意してください。", next });
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      data: {
        display_name: displayName,
        member_type: memberType,
        area,
        organization,
        specialty,
      },
    },
  });

  if (error) {
    redirectToSignup({ error: authErrorMessage(error.message), next });
  }

  redirectToSignup({
    message: "会員登録を受け付けました。確認メールが届いた場合は、メール内のリンクを開いてログインしてください。",
    next,
  });
}
