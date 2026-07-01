import { CalendarDays, ChevronRight } from "lucide-react";
import { archives } from "@/lib/data";
import { SectionTitle } from "./SectionTitle";
import { VisualTile } from "./VisualTile";

export function ArchiveSection() {
  return (
    <section className="pt-7">
      <SectionTitle title="SEMINAR / CONTEST" action="すべて見る" />
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
        {archives.map((archive, index) => (
          <article key={archive.title} className="w-[76%] shrink-0 rounded-[8px] border border-line bg-white p-3 shadow-sm">
            <VisualTile variant={index === 1 ? "seminar" : "news"} className="aspect-[16/9]" />
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <span className="rounded-full bg-blushSoft px-2 py-1 text-[0.66rem] font-black text-blush">{archive.tag}</span>
                <h3 className="mt-2 text-sm font-black leading-snug text-ink">{archive.title}</h3>
                <p className="mt-1 flex items-center gap-1 text-xs font-bold text-mute">
                  <CalendarDays aria-hidden="true" size={14} />
                  {archive.date}
                </p>
              </div>
              <ChevronRight aria-hidden="true" className="shrink-0 text-blush" size={20} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
