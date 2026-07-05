export function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "メールアドレスまたはパスワードが正しくありません。";
  }

  if (normalized.includes("email not confirmed")) {
    return "メール確認がまだ完了していません。確認メールのリンクを開いてください。";
  }

  if (normalized.includes("user already registered") || normalized.includes("already registered")) {
    return "このメールアドレスはすでに登録されています。ログインをお試しください。";
  }

  if (normalized.includes("password")) {
    return "パスワードの条件を満たしていない可能性があります。8文字以上で入力してください。";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "短時間に操作が集中しています。少し時間をおいてからもう一度お試しください。";
  }

  return "認証処理に失敗しました。入力内容を確認して、もう一度お試しください。";
}
