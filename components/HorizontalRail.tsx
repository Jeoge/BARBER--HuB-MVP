import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { MagazineImage } from "./MagazineImage";
import { ReactionBar } from "./ReactionBar";
import { SectionTitle } from "./SectionTitle";

type RailItem = {
  id: string;
  title: string;
  category: string;
  meta?: string;
  summary?: string;
  accent: string;
  imageUrl?: string;
};

type HorizontalRailProps = {
  title: string;
  items: RailItem[];
  hrefPrefix?: string;
};

export function HorizontalRail({ title, items, hrefPrefix = "/articles" }: HorizontalRailProps) {
  return (
    <section className="pt-9">
      <SectionTitle title={title} action="すべて見る" />
      <div className="no-scrollbar flex gap-3.5 overflow-x-auto px-4 pb-1">
        {items.map((item) => {
          const href = hrefPrefix === "/jobs" || hrefPrefix === "/seminars" ? hrefPrefix : `${hrefPrefix}/${item.id}`;
          const showReactions = hrefPrefix === "/articles";

          return (
            <article
              key={`${title}-${item.id}`}
              className="w-[70%] shrink-0 rounded-[8px] border border-line/80 bg-white p-2.5 shadow-[0_8px_20px_rgba(17,17,17,0.035)]"
            >
              <Link href={href} className="block">
                <MagazineImage src={item.imageUrl} alt={item.title} variant={item.accent} className="aspect-[16/9]" />
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-blush">
                      {item.category}
                    </span>
                    <h3 className="mt-1.5 line-clamp-2 text-[0.92rem] font-black leading-snug text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-xs font-medium text-mute">{item.meta ?? item.summary}</p>
                  </div>
                  <ChevronRight aria-hidden="true" className="mt-1 shrink-0 text-mute" size={16} />
                </div>
              </Link>
              {showReactions ? <ReactionBar contentId={`article:${item.id}`} commentTitle="記事へのコメント" compact className="mt-3" /> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
