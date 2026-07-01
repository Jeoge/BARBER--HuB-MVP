"use client";

import { FilePenLine } from "lucide-react";
import { useSearchParams } from "next/navigation";

const labels: Record<string, string> = {
  feed: "スナップ投稿",
  snap: "スナップ投稿",
  article: "記事を書く",
  question: "Q&Aで相談",
  anonymous: "Backyardに匿名投稿",
  report: "講習会レポート",
};

export function ComposeBanner() {
  const compose = useSearchParams().get("compose");
  if (compose == null) return null;

  return (
    <section className="px-4 pt-3">
      <div className="flex items-center gap-2 rounded-[8px] border border-blush/20 bg-blushSoft px-3 py-2 text-sm font-black text-ink">
        <FilePenLine aria-hidden="true" size={17} className="text-blush" />
        {labels[compose] ?? "投稿"}の準備画面です。MVPではここまで表示します。
      </div>
    </section>
  );
}
