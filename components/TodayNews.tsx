"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { todayNewsSets } from "@/lib/data";

type Slot = keyof typeof todayNewsSets;

function getSlot(hour: number): Slot {
  if (hour >= 7 && hour < 11) return "morning";
  if (hour >= 11 && hour < 15) return "noon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function TodayNews() {
  const [hour, setHour] = useState(9);

  useEffect(() => {
    setHour(new Date().getHours());
  }, []);

  const slot = getSlot(hour);
  const items = useMemo(() => todayNewsSets[slot], [slot]);

  return (
    <section className="px-4 pt-2.5">
      <div className="rounded-[8px] border border-line bg-white p-2 shadow-sm">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-blushSoft text-blush">
              <Sparkles aria-hidden="true" size={16} />
            </div>
            <div>
              <h2 className="text-[0.82rem] font-black text-ink">今日の3分ニュース</h2>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-mute">
                今日の営業前に、3分だけ読む
              </p>
            </div>
          </div>
          <button className="text-xs font-black text-blush">読む</button>
        </div>
        <div className="grid gap-1">
          {items.map((item) => (
            <article key={item.title} className="rounded-[7px] bg-neutral-50 px-2.5 py-1">
              <p className="text-[0.7rem] font-black text-ink">{item.title}</p>
              <p className="mt-0.5 line-clamp-1 text-[0.62rem] font-medium text-mute">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
