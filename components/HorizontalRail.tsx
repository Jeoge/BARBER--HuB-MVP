import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { SectionTitle } from "./SectionTitle";
import { VisualTile } from "./VisualTile";

type RailItem = {
  id: string;
  title: string;
  category: string;
  meta?: string;
  summary?: string;
  accent: string;
};

type HorizontalRailProps = {
  title: string;
  items: RailItem[];
  hrefPrefix?: string;
};

export function HorizontalRail({ title, items, hrefPrefix = "/articles" }: HorizontalRailProps) {
  return (
    <section className="pt-7">
      <SectionTitle title={title} action="すべて見る" />
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
        {items.map((item) => {
          const href = hrefPrefix === "/jobs" || hrefPrefix === "/seminars" ? hrefPrefix : `${hrefPrefix}/${item.id}`;

          return (
            <Link
              key={`${title}-${item.id}`}
              href={href}
              className="w-[72%] shrink-0 rounded-[8px] border border-line bg-white p-3 shadow-sm"
            >
            <VisualTile variant={item.accent} className="aspect-[16/8.5]" />
            <div className="mt-3 flex items-start justify-between gap-2">
              <div>
                <span className="rounded-full bg-blushSoft px-2 py-1 text-[0.64rem] font-black text-blush">
                  {item.category}
                </span>
                <h3 className="mt-2 line-clamp-2 text-[0.9rem] font-black leading-snug text-ink">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs font-bold text-mute">{item.meta ?? item.summary}</p>
              </div>
              <ChevronRight aria-hidden="true" className="mt-1 shrink-0 text-blush" size={18} />
            </div>
          </Link>
          );
        })}
      </div>
    </section>
  );
}
