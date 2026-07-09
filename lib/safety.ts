export function isSafetyConfirmed(formData: FormData, name: string) {
  const value = formData.get(name);
  return value === "confirmed" || value === "on" || value === "true" || value === "1";
}

export function hasSafetyConfirmations(formData: FormData, names: string[]) {
  return names.every((name) => isSafetyConfirmed(formData, name));
}

export const SAFETY_CONFIRMATION_ERROR = "安心して掲載するため、投稿前の確認欄にチェックしてください。";

export function safetyMigrationErrorMessage(target: string) {
  return `${target}を保存できませんでした。入力内容を確認して、もう一度お試しください。`;
}
