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
    <article className="h-full rounded-[8px] border border-line/80 bg-white p-2.5 shadow-[0_8px_22px_rgba(17,17,17,0.03)]">
      <MagazineImage
        src={item.imageUrl}
        alt={item.title}
        variant={item.category === "tools" ? "tool" : item.category === "seminar" ? "haircut" : "student"}
        className={compact ? "aspect-[16/7.5]" : "aspect-[16/8.5]"}
      />
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="rounded-full border border-line bg-neutral-50 px-2 py-0.5 text-[0.58rem] font-black uppercase tracking-[0.08em] text-mute">
          {item.label}
        </span>
        {item.external ? <ExternalLink aria-hidden="true" size={12} className="text-mute" /> : null}
      </div>
      <h3 className={(compact ? "text-[0.86rem]" : "text-[0.95rem]") + " mt-2 line-clamp-2 font-black leading-snug text-ink"}>{item.title}</h3>
      <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-mute">{item.description}</p>
      <p className="mt-2 truncate text-[0.62rem] font-semibold text-mute">提供：{item.sponsorName}</p>
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
    <section className={compact ? "px-4 pt-6" : "px-4 pt-8"}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-blush">{eyebrow}</p>
          <h2 className="mt-1 text-base font-black text-ink">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs font-medium leading-relaxed text-mute">{subtitle}</p> : null}
        </div>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        {items.map((item) => (
          <div key={item.id} className={(compact ? "w-[72%]" : "w-[76%]") + " shrink-0"}>
            <SponsorCard item={item} compact={compact} />
          </div>
        ))}
      </div>
    </section>
  );
}
