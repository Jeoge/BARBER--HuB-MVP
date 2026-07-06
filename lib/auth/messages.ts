export function authErrorMessage(message: string, context: "signup" | "default" = "default") {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "メールアドレスまたはパスワードが正しくありません。";
  }

  if (normalized.includes("email not confirmed")) {
    return "メール確認がまだ完了していません。確認メールのリンクを開いてください。";
  }

  if (
    normalized.includes("user already registered") ||
    normalized.includes("already registered") ||
    normalized.includes("already exists") ||
    normalized.includes("duplicate")
  ) {
    return "すでに登録済みの可能性があります。ログインをお試しください。確認メールが未確認の場合は、メール内のリンクをご確認ください。";
  }

  if (normalized.includes("email") && normalized.includes("invalid")) {
    return "メールアドレスの形式を確認してください。";
  }

  if (normalized.includes("password")) {
    return "パスワードは6文字以上で入力してください。";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many") || normalized.includes("security purposes")) {
    if (context === "signup") {
      return "短時間に何度も登録操作が行われました。少し時間をおいてから、もう一度お試しください。";
    }

    return "短時間に操作が集中しています。少し時間をおいてから、もう一度お試しください。";
  }

  if (context === "signup") {
    return "会員登録に失敗しました。時間をおいて再度お試しください。";
  }

  return "メールアドレスまたはパスワードを確認してください。";
}
