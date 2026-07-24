import "server-only";

import Stripe from "stripe";

export function getStripeConfigStatus() {
  const missing: string[] = [];
  if (!process.env.STRIPE_SECRET_KEY) missing.push("STRIPE_SECRET_KEY");
  if (!process.env.STRIPE_WEBHOOK_SECRET) missing.push("STRIPE_WEBHOOK_SECRET");
  if (!process.env.NEXT_PUBLIC_APP_URL) missing.push("NEXT_PUBLIC_APP_URL");
  return { ready: missing.length === 0, missing };
}

export function isStripeModeAllowedForEnvironment() {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const vercelEnvironment = process.env.VERCEL_ENV;
  if (vercelEnvironment === "preview") return key.startsWith("sk_test_");
  if (vercelEnvironment === "production") return key.startsWith("sk_live_");
  return true;
}

export function createStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("stripe_not_configured");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2 });
}

export function appUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!value) throw new Error("app_url_not_configured");
  const url = new URL(value);
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new Error("app_url_not_secure");
  }
  return url.origin;
}
