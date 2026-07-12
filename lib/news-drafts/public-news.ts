import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { news, type NewsItem } from "@/lib/mockData";

export type PublicNewsRow = {
  id: string;
  draft_title: string | null;
  draft_summary: string | null;
  draft_body: string | null;
  morning_tip: string | null;
  conversation_tip: string | null;
  category: string | null;
  source_name: string | null;
  source_url: string | null;
  reviewed_at: string | null;
};

export type PublicNewsItem = NewsItem & {
  sourceName?: string;
  sourceUrl?: string;
  reviewedAt?: string | null;
  origin: "approved" | "fallback";
};

const DEFAULT_PUBLIC_NEWS_LIMIT = 4;
const RELATED_PUBLIC_NEWS_LIMIT = 8;
const MAX_PUBLIC_NEWS_LIMIT = 20;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanText(value: string | null | undefined) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function clampLimit(limit: number) {
  if (!Number.isFinite(limit)) return DEFAULT_PUBLIC_NEWS_LIMIT;
  return Math.max(1, Math.min(Math.trunc(limit), MAX_PUBLIC_NEWS_LIMIT));
}

function timeLabel(value: string | null | undefined) {
  if (!value) return "公開中";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "公開中";
  return new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit" }).format(date);
}

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function toPublicNewsItem(row: PublicNewsRow): PublicNewsItem | null {
  const id = cleanText(row.id);
  const title = cleanText(row.draft_title);
  const summary = cleanText(row.draft_summary);
  const body = cleanText(row.draft_body);
  const morningTip = cleanText(row.morning_tip);
  const conversationTip = cleanText(row.conversation_tip);
  const category = cleanText(row.category);
  const sourceName = cleanText(row.source_name);
  const sourceUrl = cleanText(row.source_url);

  if (!isUuid(id) || !title || !summary || !body || !morningTip || !conversationTip || !category || !sourceName || !sourceUrl) {
    return null;
  }

  return {
    id,
    title,
    summary,
    body,
    conversationTip,
    morningTip,
    category,
    time: timeLabel(row.reviewed_at),
    sourceName,
    sourceUrl,
    reviewedAt: row.reviewed_at,
    origin: "approved",
  };
}

function toFallbackNewsItem(item: NewsItem): PublicNewsItem {
  return {
    ...item,
    origin: "fallback",
  };
}

export function composeNewsWithFallback(approvedNews: PublicNewsItem[], limit = DEFAULT_PUBLIC_NEWS_LIMIT) {
  const cappedLimit = clampLimit(limit);
  const items: PublicNewsItem[] = [];
  const usedIds = new Set<string>();

  for (const item of approvedNews) {
    if (items.length >= cappedLimit) break;
    if (!item.id || usedIds.has(item.id)) continue;
    items.push(item);
    usedIds.add(item.id);
  }

  for (const item of news) {
    if (items.length >= cappedLimit) break;
    if (usedIds.has(item.id)) continue;
    items.push(toFallbackNewsItem(item));
    usedIds.add(item.id);
  }

  return items;
}

export function composeRelatedNews(approvedNews: PublicNewsItem[], currentId: string, limit = 3) {
  const items: PublicNewsItem[] = [];
  const usedIds = new Set<string>([currentId]);

  for (const item of approvedNews) {
    if (items.length >= limit) break;
    if (!item.id || usedIds.has(item.id)) continue;
    items.push(item);
    usedIds.add(item.id);
  }

  for (const item of news) {
    if (items.length >= limit) break;
    if (usedIds.has(item.id)) continue;
    items.push(toFallbackNewsItem(item));
    usedIds.add(item.id);
  }

  return items;
}

export async function listPublicNews(supabase: SupabaseClient, limit = DEFAULT_PUBLIC_NEWS_LIMIT) {
  try {
    const cappedLimit = clampLimit(limit);
    const { data, error } = await supabase.rpc("list_public_news", { news_limit: cappedLimit }).returns<PublicNewsRow[]>();

    if (error) {
      return { news: [], error };
    }

    return {
      news: (Array.isArray(data) ? data : []).map(toPublicNewsItem).filter((item): item is PublicNewsItem => item != null),
      error: null,
    };
  } catch (error) {
    return { news: [], error };
  }
}

export async function getPublicNewsById(supabase: SupabaseClient, id: string) {
  if (!isUuid(id)) {
    return { news: null, error: null };
  }

  try {
    const { data, error } = await supabase.rpc("get_public_news_by_id", { news_id: id }).returns<PublicNewsRow[]>();

    if (error) {
      return { news: null, error };
    }

    const row = Array.isArray(data) ? data[0] : null;
    return {
      news: row ? toPublicNewsItem(row) : null,
      error: null,
    };
  } catch (error) {
    return { news: null, error };
  }
}

export async function listRelatedPublicNews(supabase: SupabaseClient, currentId: string, limit = 3) {
  const { news: approvedNews, error } = await listPublicNews(supabase, Math.max(RELATED_PUBLIC_NEWS_LIMIT, limit));
  return {
    news: composeRelatedNews(approvedNews, currentId, limit),
    error,
  };
}
