"use client";

import { MessageCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { posts } from "@/lib/mockData";

function rotate<T>(items: T[], offset: number) {
  return items.map((_, index) => items[(index + offset) % items.length]);
}

export function ThanksRanking() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const current = new Date();
    setOffset((current.getHours() + current.getMinutes()) % posts.length);
  }, []);

  const items = useMemo(() => rotate(posts, offset), [offset]);

  return (
    <section className="pt-4">
      <div className="mx-4 rounded-[8px] border border-line bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp aria-hidden="true" size={17} className="text-blush" />
            <h2 className="text-sm font-black text-ink">THANKSランキング更新中</h2>
          </div>
          <p className="text-[0.66rem] font-bold text-mute">開くたびに変化</p>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {items.slice(0, 5).map((item, index) => (
            <Link
              key={item.id}
              href={`/posts/${item.id}`}
              className="w-[72%] shrink-0 rounded-[7px] bg-neutral-50 px-3 py-2"
            >
              <p className="text-[0.68rem] font-black text-blush">#{index + 1} {item.authorLabel}</p>
              <p className="mt-1 line-clamp-1 text-[0.8rem] font-black text-ink">{item.body}</p>
              <p className="mt-1 flex items-center gap-1 text-xs font-black text-mute">
                <MessageCircle aria-hidden="true" size={14} />
                THANKS {item.thanks}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
