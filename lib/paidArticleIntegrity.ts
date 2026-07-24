export type PurchasedPaidArticleEdit = {
  hasPurchaseHistory: boolean;
  currentAccessType: string | null;
  nextAccessType: "free" | "paid";
  existingPaidBody: string | null;
  nextPaidBody: string;
};

export const PAID_ARTICLE_PURCHASE_HISTORY_STATUSES = ["completed", "partially_refunded"];

export function purchasedPaidArticleEditError({
  hasPurchaseHistory,
  currentAccessType,
  nextAccessType,
  existingPaidBody,
  nextPaidBody,
}: PurchasedPaidArticleEdit) {
  if (!hasPurchaseHistory) return null;
  if (currentAccessType !== "paid" || nextAccessType !== "paid") {
    return "購入実績がある有料記事は無料公開へ変更できません。";
  }
  if (!existingPaidBody || !nextPaidBody) {
    return "購入実績がある有料本文は空にしたり削除したりできません。";
  }
  if (existingPaidBody !== nextPaidBody) {
    return "購入実績がある有料本文は、購入者の内容を守るため編集できません。";
  }
  return null;
}
