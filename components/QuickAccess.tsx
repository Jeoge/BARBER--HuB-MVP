import { Briefcase, GraduationCap, MessageSquare, ShoppingBag, Sparkles, Video } from "lucide-react";
import { quickAccessItems } from "@/lib/data";
import { SectionTitle } from "./SectionTitle";

const icons = [MessageSquare, Video, Briefcase, GraduationCap, ShoppingBag, Sparkles];

export function QuickAccess() {
  return (
    <section className="pt-7">
      <SectionTitle title="QUICK ACCESS" />
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1">
        {quickAccessItems.map((item, index) => {
          const Icon = icons[index] ?? MessageSquare;
          return (
            <button
              key={item}
              className="grid h-24 w-24 shrink-0 place-items-center rounded-[8px] border border-line bg-white p-3 text-center shadow-sm"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-blushSoft text-blush">
                <Icon aria-hidden="true" size={20} />
              </span>
              <span className="text-xs font-black leading-tight text-ink">{item}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
