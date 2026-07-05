import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { type SponsorItem } from "@/lib/sponsors";
import { MagazineImage } from "./MagazineImage";

type SponsorSectionProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  items: SponsorItem[];
  compact?: boolean;
};

function SponsorCard({ item, compact = false }: { item: SponsorItem; compact?: boolean }) {
  const card = (
    <article className={(compact ? "p-2.5" : "p-2") + " h-full rounded-[8px] border border-line/80 bg-white shadow-[0_8px_22px_rgba(17,17,17,0.03)]"}>
      <MagazineImage
        src={item.imageUrl}
        alt={item.title}
        variant={item.category === "tools" ? "tool" : item.category === "seminar" ? "haircut" : "student"}
        className={compact ? "aspect-[16/7.5]" : "aspect-[4/3]"}
      />
      <div className={compact ? "mt-2.5 flex items-center justify-between gap-2" : "mt-2 flex items-center justify-between gap-1.5"}>
        <span className="rounded-full border border-line bg-neutral-50 px-2 py-0.5 text-[0.58rem] font-black uppercase tracking-[0.08em] text-mute">
          {item.label}
        </span>
        {item.external ? <ExternalLink aria-hidden="true" size={12} className="text-mute" /> : null}
      </div>
      <h3 className={(compact ? "text-[0.86rem]" : "text-[0.74rem]") + " mt-1.5 line-clamp-2 font-black leading-snug text-ink"}>{item.title}</h3>
      {compact ? <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-mute">{item.description}</p> : null}
      <p className={(compact ? "mt-2" : "mt-1.5") + " truncate text-[0.58rem] font-semibold text-mute"}>提供：{item.sponsorName}</p>
    </article>
  );

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className="block h-full">
        {card}
      </a>
    );
  }

  return (
    <Link href={item.href} className="block h-full">
      {card}
    </Link>
  );
}

export function SponsorSection({ eyebrow = "Sponsored", title, subtitle, items, compact = false }: SponsorSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className={compact ? "px-4 pt-6" : "px-4 pt-7"}>
      <div className={compact ? "mb-3 flex items-end justify-between gap-3" : "mb-2.5 flex items-end justify-between gap-3"}>
        <div>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-blush">{eyebrow}</p>
          <h2 className={(compact ? "text-base" : "text-[0.96rem]") + " mt-1 font-black text-ink"}>{title}</h2>
          {subtitle ? <p className="mt-1 text-xs font-medium leading-relaxed text-mute">{subtitle}</p> : null}
        </div>
      </div>
      <div className={compact ? "no-scrollbar flex gap-3 overflow-x-auto pb-1" : "no-scrollbar flex gap-2.5 overflow-x-auto pb-1"}>
        {items.map((item) => (
          <div key={item.id} className={(compact ? "w-[72%]" : "w-[42%]") + " shrink-0"}>
            <SponsorCard item={item} compact={compact} />
          </div>
        ))}
      </div>
    </section>
  );
}
