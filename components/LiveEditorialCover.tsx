"use client";

import { ChevronRight, Newspaper } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  fallbackEditorPickItems,
  rotateEditorPicks,
  type HomeEditorPickItem,
} from "@/lib/editorPicks";
import { isPublishedWithinHours } from "@/lib/news-drafts/quality";
import { news } from "@/lib/mockData";
import type { NewsItem } from "@/lib/mockData";
import { MagazineImage } from "./MagazineImage";
import { ProfileMiniLink } from "./ProfileMiniLink";

const newsTitles: Record<string, string> = {
  "scalp-care-rainy": "梅雨時期の頭皮ケア需要が増加中",
  "google-review-reply": "口コミ返信で新規予約率が変わる",
  "grooming-fragrance-summer": "夏の身だしなみ、香りは控えめに",
  "music-bgm-smalltalk": "店内BGM、今日は少しだけ軽く",
  "heatstroke-smalltalk": "今日の時事メモ：熱中症対策を早めに",
};

export type LiveEditorialNewsItem = NewsItem & {
  sourceName?: string;
  sourceUrl?: string;
  reviewedAt?: string | null;
  origin?: "approved" | "fallback";
};

type LiveEditorialCoverProps = {
  newsItems?: LiveEditorialNewsItem[];
  editorPicks?: HomeEditorPickItem[];
};

function newsKey(item: LiveEditorialNewsItem) {
  return `${item.origin ?? "fallback"}-${item.id}`;
}

function isNewNewsItem(item: LiveEditorialNewsItem, now: Date) {
  return item.origin === "approved" && isPublishedWithinHours(item.reviewedAt, now, 12);
}

export function LiveEditorialCover({ newsItems, editorPicks }: LiveEditorialCoverProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const state = useMemo(() => {
    const current = now ?? new Date(2026, 0, 1, 9, 30);
    const fallbackItems = fallbackEditorPickItems();
    const offset = (current.getHours() + current.getMinutes()) % fallbackItems.length;
    const minutes = Math.floor(current.getMinutes() / 10) * 10;
    const updatedAt = `${String(current.getHours()).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    const picks = editorPicks && editorPicks.length > 0 ? editorPicks : rotateEditorPicks(fallbackItems, offset);
    return { current, picks, updatedAt };
  }, [editorPicks, now]);

  const lead = state.picks[0];
  const highlights = state.picks.slice(1, 3);
  const displayedNews = newsItems && newsItems.length > 0 ? newsItems.slice(0, 4) : news.slice(0, 4);
  const leadNews = displayedNews[0];

  return (
    <section className="px-4 pt-3">
      <div className="flex items-center justify-between gap-3">
        <p className="editorial-label text-[1.02rem] uppercase leading-none text-blush">EDITOR&apos;S PICK</p>
        <p className="text-[0.62rem] font-medium uppercase tracking-[0.12em] text-mute">{state.updatedAt} update</p>
      </div>

      <div className="no-scrollbar mt-2.5 -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {[lead, ...highlights].map((pick, index) => (
          <article
            key={pick.key}
            className={(index === 0 ? "w-[72%]" : "w-[56%]") + " shrink-0 snap-start rounded-[7px] border border-line/60 bg-white p-2 shadow-[0_5px_14px_rgba(17,17,17,0.022)]"}
          >
            <Link href={pick.href} className="block">
              <MagazineImage src={pick.imageUrl} alt={pick.title} variant={pick.imageVariant} className="aspect-[16/7.6]" />
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <p className="text-[0.54rem] font-semibold uppercase tracking-[0.13em] text-blush">{pick.tag}</p>
                {index === 0 ? (
                  <span className="inline-flex items-center gap-0.5 text-[0.58rem] font-semibold text-mute">
                    READ
                    <ChevronRight aria-hidden="true" size={11} />
                  </span>
                ) : null}
              </div>
              <h3 className={(index === 0 ? "text-[0.9rem]" : "text-[0.76rem]") + " editorial-serif mt-1 line-clamp-2 leading-snug text-ink"}>
                {pick.title}
              </h3>
            </Link>
            {index === 0 ? (
              <ProfileMiniLink
                profileId={pick.profileId}
                fallbackName={pick.authorName}
                avatarUrl={pick.avatarUrl}
                compact
                size="feed"
                className="mt-1.5 max-w-full"
              />
            ) : null}
          </article>
        ))}
      </div>

      <div className="mt-2.5 rounded-[8px] border border-line/80 bg-white px-3 py-2.5 shadow-[0_6px_18px_rgba(17,17,17,0.025)]">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <p className="editorial-label text-[0.82rem] uppercase text-blush">3MIN NEWS</p>
          <Link href={`/news/${leadNews?.id ?? ""}`} className="text-xs font-medium text-blush">
            もっと読む
          </Link>
        </div>
        <div className="grid gap-1.5">
          {displayedNews.map((item) => (
            <Link key={newsKey(item)} href={`/news/${item.id}`} className="flex items-center gap-2">
              <span className="relative flex h-3 w-3 shrink-0 items-center justify-center">
                {isNewNewsItem(item, state.current) ? (
                  <span className="absolute left-1/2 top-[-0.48rem] -translate-x-1/2 text-[8px] font-black leading-none text-blush">
                    NEW
                  </span>
                ) : null}
                <Newspaper aria-hidden="true" size={12} className="text-mute" />
              </span>
              <p className="min-w-0 flex-1 truncate text-[0.76rem] font-semibold text-ink">{newsTitles[item.id] ?? item.title}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
