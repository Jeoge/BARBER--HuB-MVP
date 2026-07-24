export const PAID_ARTICLE_PRICES = [100, 300, 500, 1000] as const;
export const TREAT_AMOUNTS = [300, 500, 1000] as const;
export const MONETIZATION_CURRENCY = "jpy";
export const PLATFORM_FEE_PERCENT = 15;

export type TreatTargetType = "snap" | "article" | "backroom_thread" | "backroom_comment";
export type PaymentStatus = "pending" | "completed" | "expired" | "failed" | "partially_refunded" | "refunded";

export function isMonetizationEnabled() {
  return process.env.BARBER_HUB_MONETIZATION_ENABLED === "true";
}

export function isPaidArticlePrice(value: number): value is (typeof PAID_ARTICLE_PRICES)[number] {
  return PAID_ARTICLE_PRICES.includes(value as (typeof PAID_ARTICLE_PRICES)[number]);
}

export function isTreatAmount(value: number): value is (typeof TREAT_AMOUNTS)[number] {
  return TREAT_AMOUNTS.includes(value as (typeof TREAT_AMOUNTS)[number]);
}

export function isTreatTargetType(value: string): value is TreatTargetType {
  return value === "snap" || value === "article" || value === "backroom_thread" || value === "backroom_comment";
}

export function calculatePlatformAmounts(amount: number) {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("invalid_amount");
  const platformFeeAmount = Math.floor((amount * PLATFORM_FEE_PERCENT) / 100);
  const recipientAmount = amount - platformFeeAmount;

  if (platformFeeAmount < 0 || platformFeeAmount >= amount || recipientAmount <= 0) {
    throw new Error("invalid_platform_fee");
  }

  return { platformFeeAmount, recipientAmount };
}

export function formatJpy(amount: number) {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(amount);
}

export function refundStatusFromAmounts(originalAmount: number, amountRefunded: number): Extract<PaymentStatus, "partially_refunded" | "refunded"> | null {
  if (!Number.isSafeInteger(originalAmount) || originalAmount <= 0 || !Number.isSafeInteger(amountRefunded) || amountRefunded <= 0) return null;
  return amountRefunded >= originalAmount ? "refunded" : "partially_refunded";
}

export function paymentStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "completed": return "完了";
    case "partially_refunded": return "一部返金";
    case "refunded": return "返金済み";
    case "expired": return "期限切れ";
    case "failed": return "失敗";
    default: return "決済確認中";
  }
}
