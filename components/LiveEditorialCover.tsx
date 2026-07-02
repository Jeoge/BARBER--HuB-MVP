"use client";

import { ChevronRight, Newspaper } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { articles, news, posts, qaItems } from "@/lib/mockData";
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
  return "/images/editor-pick-qa.jpg";
}

function variantForPick(pick: (typeof editorPickItems)[number]) {
  return "accent" in pick.item ? pick.item.accent : "haircut";
}

export function LiveEditorialCover() {
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

  return (
    <section className="px-4 pt-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-blush">EDITOR&apos;S PICK</p>
          <h2 className="mt-1 text-[1.08rem] font-black leading-tight text-ink">今、見るべき情報</h2>
        </div>
        <p className="pb-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-mute">{state.updatedAt} update</p>
      </div>

      <div className="no-scrollbar mt-3 -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {[lead, ...highlights].map((pick, index) => (
          <article
            key={`${pick.type}-${pick.item.id}`}
            className={(index === 0 ? "w-[74%]" : "w-[58%]") + " shrink-0 snap-start rounded-[7px] border border-line/60 bg-white p-2.5 shadow-[0_5px_14px_rgba(17,17,17,0.025)]"}
          >
            <Link href={hrefForPick(pick)} className="block">
              <MagazineImage src={imageForPick(pick)} alt={pick.title} variant={variantForPick(pick)} className="aspect-[16/8.2]" />
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-blush">{pick.tag}</p>
                {index === 0 ? (
                  <span className="inline-flex items-center gap-0.5 text-[0.62rem] font-semibold text-mute">
                    READ
                    <ChevronRight aria-hidden="true" size={12} />
                  </span>
                ) : null}
              </div>
              <h3 className={(index === 0 ? "text-[0.94rem]" : "text-[0.78rem]") + " mt-1 line-clamp-2 font-extrabold leading-snug text-ink"}>
                {pick.title}
              </h3>
            </Link>
            {index === 0 ? (
              <ProfileMiniLink profileId={profileIdForPick(pick)} fallbackName={sourceForPick(pick)} compact className="mt-2 max-w-full" />
            ) : null}
          </article>
        ))}
      </div>

      <div className="mt-3 rounded-[8px] border border-line/80 bg-white px-3.5 py-3 shadow-[0_6px_18px_rgba(17,17,17,0.03)]">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-blush">3 MIN NEWS</p>
            <h3 className="mt-0.5 text-[0.94rem] font-black text-ink">今日の3分ニュース</h3>
          </div>
          <Link href={`/news/${news[0]?.id ?? ""}`} className="text-xs font-semibold text-blush">
            もっと読む
          </Link>
        </div>
        <div className="grid gap-2">
          {news.slice(0, 3).map((item) => (
            <Link key={item.id} href={`/news/${item.id}`} className="flex items-center gap-2.5">
              <Newspaper aria-hidden="true" size={13} className="shrink-0 text-mute" />
              <p className="min-w-0 flex-1 truncate text-[0.78rem] font-semibold text-ink">
                {newsTitles[item.id] ?? item.title}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
