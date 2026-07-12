import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { runNewsDraftPipeline } from "@/lib/news-drafts/ingest";
import { HARD_NEWS_DRAFT_MAX_ITEMS } from "@/lib/news-drafts/sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

function bearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || request.headers.get("x-news-ingest-secret")?.trim() || "";
}

function isAuthorized(request: NextRequest) {
  const token = bearerToken(request);
  const allowedSecrets = [process.env.NEWS_INGEST_SECRET, process.env.CRON_SECRET].filter((value): value is string => Boolean(value));

  if (!token || allowedSecrets.length === 0) return false;
  return allowedSecrets.some((secret) => safeEqual(token, secret));
}

function limitFromRequest(request: NextRequest) {
  const value = Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "", 10);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return Math.min(value, HARD_NEWS_DRAFT_MAX_ITEMS);
}

async function handleRun(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runNewsDraftPipeline({ maxItems: limitFromRequest(request) });
    return NextResponse.json({
      ok: true,
      fetchedCount: result.fetchedCount,
      duplicateCount: result.duplicateCount,
      skippedCount: result.skippedCount,
      generatedCount: result.generatedCount,
      failedCount: result.failedCount,
      insertedCount: result.insertedCount,
      sourceErrorCount: result.sourceErrorCount,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "ニュース収集を実行できませんでした。" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleRun(request);
}

export async function POST(request: NextRequest) {
  return handleRun(request);
}
