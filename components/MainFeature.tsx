"use client";

import { ChevronRight, Quote } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { articles } from "@/lib/mockData";

const featuredArticles = articles.slice(0, 5);

const tones = [
  "from-neutral-950 via-neutral-900 to-neutral-700",
  "from-stone-950 via-zinc-900 to-zinc-700",
  "from-neutral-900 via-neutral-800 to-stone-600",
  "from-zinc-950 via-neutral-800 to-stone-500",
  "from-neutral-950 via-stone-900 to-neutral-600",
];

export function MainFeature() {
  const [index, setIndex] = useState(0);
  const article = featuredArticles[index % featuredArticles.length];

  useEffect(() => {
    setIndex(Math.floor(Date.now() / 1000) % featuredArticles.length);
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % featuredArticles.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="px-4 pt-3">
      <Link
        href={`/articles/${article.id}`}
        className={
          "relative block min-h-[250px] overflow-hidden rounded-[8px] bg-gradient-to-br p-4 text-white shadow-soft " +
          tones[index % tones.length]
        }
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,rgba(255,255,255,0.18),transparent_22rem)]" />
        <div className="absolute -right-12 top-20 h-52 w-52 rounded-full border border-white/10" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />
        <div className="relative flex min-h-[218px] flex-col justify-between">
          <div>
            <span className="inline-flex rounded-full bg-blush px-3 py-1 text-[0.66rem] font-black tracking-[0.08em]">
              {article.category}
            </span>
            <h2 className="mt-4 text-[1.42rem] font-black leading-[1.13]">{article.title}</h2>
            <p className="mt-2 line-clamp-2 max-w-[18rem] text-[0.82rem] font-medium leading-relaxed text-white/86">
              {article.summary}
            </p>
          </div>
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold text-white/82">
              <Quote aria-hidden="true" size={16} />
              <span>{article.author}</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-black text-ink">
              READ
              <ChevronRight aria-hidden="true" size={14} />
            </span>
          </div>
        </div>
      </Link>
      <div className="mt-2 flex justify-center gap-1.5">
        {featuredArticles.map((item, itemIndex) => (
          <button
            key={item.id}
            aria-label={item.title}
            className={
              "h-2 rounded-full transition-all " +
              (itemIndex === index % featuredArticles.length ? "w-6 bg-blush" : "w-2 bg-neutral-300")
            }
            onClick={() => setIndex(itemIndex)}
          />
        ))}
      </div>
    </section>
  );
}
