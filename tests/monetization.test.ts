import assert from "node:assert/strict";
import test from "node:test";
import { isPaidEligibleArticleCategory } from "../lib/articleCategories.ts";
import { calculatePlatformAmounts, isPaidArticlePrice, isTreatAmount, refundStatusFromAmounts } from "../lib/monetization.ts";

test("Treat and paid article amounts are limited to the approved JPY tiers", () => {
  assert.equal(isTreatAmount(300), true);
  assert.equal(isTreatAmount(500), true);
  assert.equal(isTreatAmount(1000), true);
  assert.equal(isTreatAmount(301), false);
  assert.equal(isPaidArticlePrice(100), true);
  assert.equal(isPaidArticlePrice(1000), true);
  assert.equal(isPaidArticlePrice(200), false);
});

test("platform fee is a centrally calculated 15 percent", () => {
  assert.deepEqual(calculatePlatformAmounts(300), { platformFeeAmount: 45, recipientAmount: 255 });
  assert.deepEqual(calculatePlatformAmounts(1000), { platformFeeAmount: 150, recipientAmount: 850 });
});

test("refund status only revokes a payment after the full original amount is refunded", () => {
  assert.equal(refundStatusFromAmounts(1000, 0), null);
  assert.equal(refundStatusFromAmounts(1000, 1), "partially_refunded");
  assert.equal(refundStatusFromAmounts(1000, 999), "partially_refunded");
  assert.equal(refundStatusFromAmounts(1000, 1000), "refunded");
});

test("only experience and seminar report articles can be paid", () => {
  assert.equal(isPaidEligibleArticleCategory("経験記事"), true);
  assert.equal(isPaidEligibleArticleCategory("講習会レポート"), true);
  assert.equal(isPaidEligibleArticleCategory("コンクールレポート"), false);
  assert.equal(isPaidEligibleArticleCategory("経営"), false);
});
