export function authErrorMessage(message: string, context: "signup" | "default" = "default") {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "メールアドレスまたはパスワードが正しくありません。";
  }

  if (normalized.includes("email not confirmed")) {
    return "メール確認がまだ完了していません。確認メールのリンクを開いてください。";
  }

  if (normalized.includes("user already registered") || normalized.includes("already registered")) {
    return "すでに登録済みのメールアドレスの可能性があります。ログインをお試しください。";
  }

  if (normalized.includes("password")) {
    return "パスワードの条件を満たしていない可能性があります。6文字以上で入力してください。";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    if (context === "signup") {
      return "短時間に何度も登録操作が行われました。少し時間をおいてから、もう一度お試しください。";
    }

    return "短時間に操作が集中しています。少し時間をおいてから、もう一度お試しください。";
  }

  return "メールアドレスまたはパスワードを確認してください。";
}
