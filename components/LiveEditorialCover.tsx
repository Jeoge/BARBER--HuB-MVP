"use client";

import { ChevronRight, Newspaper } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { articles, news, posts, qaItems } from "@/lib/mockData";
import type { NewsItem } from "@/lib/mockData";
import { MagazineImage } from "./MagazineImage";
import { ProfileMiniLink } from "./ProfileMiniLink";

const editorPickItems = [
  { type: "article", tag: "FEATURE", item: articles[0], title: "仕上げ前の一言で、次回予約が変わる" },
  { type: "post", tag: "SNAP", item: posts[0], title: "今日のフェード投稿" },
  { type: "article", tag: "TOOLS", item: articles.find((article) => article.id === "silent-clipper") ?? articles[0], title: "静音バリカンを朝イチ施術で試す" },
  { type: "qa", tag: "Q&A", item: qaItems[0], title: "フェードのぼかしがつながらない" },
  { type: "article", tag: "SEMINAR", item: articles.find((article) => article.id === "fukuoka-seminar") ?? articles[0], title: "講習会に行けない人の全国レポート" },
];

const newsTitles: Record<string, string> = {
  "scalp-care-rainy": "梅雨時期の頭皮ケア需要が増加中",
  "google-review-reply": "口コミ返信で新規予約率が変わる",
  "silent-clipper-news": "静音バリカンの新商品が話題",
  "gray-blending-40s": "40代男性に白髪ぼかし提案が増加",
  "heatstroke-smalltalk": "今日の時事メモ：熱中症対策を早めに",
};

function rotate<T>(items: T[], offset: number) {
  return items.map((_, index) => items[(index + offset) % items.length]);
}

function hrefForPick(pick: (typeof editorPickItems)[number]) {
  if (pick.type === "post") return `/posts/${pick.item.id}`;
  if (pick.type === "qa") return `/qa/${pick.item.id}`;
  return `/articles/${pick.item.id}`;
}

function sourceForPick(pick: (typeof editorPickItems)[number]) {
  if ("authorLabel" in pick.item) return pick.item.authorLabel;
  if ("author" in pick.item) return pick.item.author;
  return "BARBER HUB EDIT";
}

function profileIdForPick(pick: (typeof editorPickItems)[number]) {
  if ("profileId" in pick.item) return pick.item.profileId;
  return "barber-hub-editor";
}

function imageForPick(pick: (typeof editorPickItems)[number]) {
  if ("imageUrl" in pick.item) return pick.item.imageUrl;
  return undefined;
}

function variantForPick(pick: (typeof editorPickItems)[number]) {
  return "accent" in pick.item ? pick.item.accent : "haircut";
}

export type LiveEditorialNewsItem = NewsItem & {
  sourceName?: string;
  sourceUrl?: string;
  reviewedAt?: string | null;
  origin?: "approved" | "fallback";
};

type LiveEditorialCoverProps = {
  newsItems?: LiveEditorialNewsItem[];
};

function newsKey(item: LiveEditorialNewsItem) {
  return `${item.origin ?? "fallback"}-${item.id}`;
}

export function LiveEditorialCover({ newsItems }: LiveEditorialCoverProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const state = useMemo(() => {
    const current = now ?? new Date(2026, 0, 1, 9, 30);
    const offset = (current.getHours() + current.getMinutes()) % editorPickItems.length;
    const minutes = Math.floor(current.getMinutes() / 10) * 10;
    const updatedAt = `${String(current.getHours()).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    return { picks: rotate(editorPickItems, offset), updatedAt };
  }, [now]);

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
            key={`${pick.type}-${pick.item.id}`}
            className={(index === 0 ? "w-[72%]" : "w-[56%]") + " shrink-0 snap-start rounded-[7px] border border-line/60 bg-white p-2 shadow-[0_5px_14px_rgba(17,17,17,0.022)]"}
          >
            <Link href={hrefForPick(pick)} className="block">
              <MagazineImage src={imageForPick(pick)} alt={pick.title} variant={variantForPick(pick)} className="aspect-[16/7.6]" />
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
            {index === 0 ? <ProfileMiniLink profileId={profileIdForPick(pick)} fallbackName={sourceForPick(pick)} compact className="mt-1.5 max-w-full" /> : null}
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
              <Newspaper aria-hidden="true" size={12} className="shrink-0 text-mute" />
              <p className="min-w-0 flex-1 truncate text-[0.76rem] font-semibold text-ink">{newsTitles[item.id] ?? item.title}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
