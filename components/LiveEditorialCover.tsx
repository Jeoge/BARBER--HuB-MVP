"use client";

import { MessageCircle, Newspaper, RefreshCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { articles, news, posts, qaItems } from "@/lib/mockData";
import { VisualTile } from "./VisualTile";

const editorPickItems = [
  { type: "article", tag: "固定記事", item: articles[0] },
  { type: "post", tag: "投稿", item: posts[0] },
  { type: "article", tag: "新商品", item: articles.find((article) => article.id === "silent-clipper") ?? articles[0] },
  { type: "qa", tag: "Q&A", item: qaItems[0] },
  { type: "article", tag: "講習会", item: articles.find((article) => article.id === "fukuoka-seminar") ?? articles[0] },
];

function rotate<T>(items: T[], offset: number) {
  return items.map((_, index) => items[(index + offset) % items.length]);
}

function hrefForPick(pick: (typeof editorPickItems)[number]) {
  if (pick.type === "post") return `/posts/${pick.item.id}`;
  if (pick.type === "qa") return `/qa/${pick.item.id}`;
  return `/articles/${pick.item.id}`;
}

function titleForPick(pick: (typeof editorPickItems)[number]) {
  return "title" in pick.item ? pick.item.title : pick.item.body;
}

function authorForPick(pick: (typeof editorPickItems)[number]) {
  if ("authorLabel" in pick.item) return pick.item.authorLabel;
  if ("author" in pick.item) return pick.item.author;
  return "Q&A編集部";
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

  return (
    <section className="px-3.5 pt-1.5">
      <div className="rounded-[8px] border border-blush/20 bg-white p-2 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 gap-2">
            <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blushSoft text-blush">
              <Sparkles aria-hidden="true" size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-blush">
                AI編集部がトップページを編集中
              </p>
              <h2 className="mt-0.5 text-[0.92rem] font-black leading-tight text-ink">
                AI編集部が選んだ、今見るべき情報
              </h2>
              <p className="mt-0.5 truncate text-[0.65rem] font-bold text-mute">
                写真・ニュース・投稿を営業前に整理
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[0.56rem] font-black text-mute">更新</p>
            <p className="text-xs font-black text-ink">{state.updatedAt}</p>
          </div>
        </div>

        <div className="mt-1.5 flex items-center gap-1.5 overflow-hidden">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-neutral-50 px-2 py-1 text-[0.62rem] font-black text-ink">
            <RefreshCcw aria-hidden="true" size={12} className="text-blush" />
            開くたびに更新
          </span>
          <span className="inline-flex shrink-0 rounded-full bg-blushSoft px-2 py-1 text-[0.62rem] font-black text-blush">
            あなた向け
          </span>
          <span className="truncate text-[0.62rem] font-bold text-mute">
            地域：東京 / 興味：技術・集客・AI
          </span>
        </div>

        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-[0.84rem] font-black text-ink">今見るべき5本</h3>
            <span className="text-[0.62rem] font-bold text-mute">写真付きで更新</span>
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {state.picks.map((pick) => (
              <Link
                key={`${pick.type}-${pick.item.id}`}
                href={hrefForPick(pick)}
                className="w-[53%] shrink-0 rounded-[8px] border border-line bg-white p-1.5 shadow-sm"
              >
                <VisualTile variant={"accent" in pick.item ? pick.item.accent : "haircut"} className="aspect-[16/7.5]" />
                <div className="mt-1.5 flex items-center justify-between gap-1.5">
                  <span className="rounded-full bg-blushSoft px-2 py-0.5 text-[0.57rem] font-black text-blush">
                    {pick.tag}
                  </span>
                  <span className="flex items-center gap-1 text-[0.6rem] font-black text-mute">
                    <MessageCircle aria-hidden="true" size={11} />
                    {"thanks" in pick.item ? pick.item.thanks : pick.item.comments}
                  </span>
                </div>
                <h4 className="mt-1 line-clamp-2 min-h-[1.72rem] text-[0.67rem] font-black leading-snug text-ink">
                  {titleForPick(pick)}
                </h4>
                <p className="mt-0.5 truncate text-[0.58rem] font-bold text-mute">
                  {authorForPick(pick)}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-1.5">
          <div className="mb-1 flex items-end justify-between gap-2">
            <div>
              <h3 className="text-[0.84rem] font-black text-ink">今日の3分ニュース</h3>
              <p className="text-[0.62rem] font-bold text-mute">営業前に読める、会話と経営の小ネタ</p>
            </div>
            <button className="shrink-0 text-[0.62rem] font-black text-blush">もっと読む</button>
          </div>
          <div className="grid gap-0.5">
            {news.slice(0, 5).map((item) => (
              <Link key={item.id} href={`/news/${item.id}`} className="flex items-center gap-2 rounded-[7px] bg-neutral-50 px-2 py-1">
                <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-blush">
                  <Newspaper aria-hidden="true" size={11} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.67rem] font-black leading-tight text-ink">{item.title}</p>
                  <p className="mt-0.5 truncate text-[0.58rem] font-medium leading-tight text-mute">{item.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
