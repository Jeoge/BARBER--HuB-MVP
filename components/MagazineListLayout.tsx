"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { FollowButton } from "./FollowButton";
import { MagazineImage } from "./MagazineImage";

export type MagazineListItem = {
  href: string;
  label: string;
  title: string;
  description?: string;
  meta?: string;
  imageUrl?: string;
  variant?: string;
  imageClassName?: string;
  tags?: string[];
  authorId?: string;
};

export function MagazinePageHeader({
  eyebrow,
  title,
  description,
  tags,
}: {
  eyebrow: string;
  title: string;
  description: string;
  tags?: string[];
}) {
  return (
    <section className="px-4 pb-1 pt-7">
      <p className="editorial-label text-[0.78rem] uppercase text-blush">{eyebrow}</p>
      <h1 className="editorial-serif mt-2 text-[1.9rem] leading-[1.08] text-ink">{title}</h1>
      <p className="mt-3 max-w-[22rem] text-[0.86rem] font-medium leading-relaxed text-mute">{description}</p>
      {tags && tags.length > 0 ? (
        <div className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto pb-1">
          {tags.map((tag) => (
            <span key={tag} className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-[0.66rem] font-semibold text-ink/76">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function MagazineSectionHeading({ eyebrow, title, actionHref, actionLabel = "すべて見る" }: { eyebrow?: string; title: string; actionHref?: string; actionLabel?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        {eyebrow ? <p className="editorial-label text-[0.64rem] uppercase text-blush">{eyebrow}</p> : null}
        <h2 className="editorial-serif mt-1 text-[1.18rem] leading-tight text-ink">{title}</h2>
      </div>
      {actionHref ? (
        <Link href={actionHref} className="pb-0.5 text-xs font-semibold text-blush">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function MagazineFeaturedCard({ item, eyebrow = "EDITOR'S PICK", portrait = false }: { item: MagazineListItem; eyebrow?: string; portrait?: boolean }) {
  return (
    <section className="px-4 pt-6">
      <p className="editorial-label text-[0.68rem] uppercase text-blush">{eyebrow}</p>
      <Link href={item.href} className="mt-3 block rounded-[10px] border border-line/80 bg-white p-3 shadow-[0_14px_34px_rgba(17,17,17,0.045)]">
        <MagazineImage
          src={item.imageUrl}
          alt={item.title}
          variant={item.variant}
          className={portrait ? "aspect-[4/5]" : "aspect-[16/9]"}
          imageClassName={item.imageClassName}
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-blush">{item.label}</p>
          <span className="inline-flex items-center gap-1 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-mute">
            READ
            <ChevronRight aria-hidden="true" size={12} />
          </span>
        </div>
        <h2 className="editorial-serif mt-1 line-clamp-3 text-[1.28rem] leading-tight text-ink">{item.title}</h2>
        {item.description ? <p className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed text-mute">{item.description}</p> : null}
      </Link>
    </section>
  );
}

export function MagazineRail({ title, eyebrow, items, portrait = false }: { title: string; eyebrow?: string; items: MagazineListItem[]; portrait?: boolean }) {
  if (items.length === 0) return null;

  return (
    <section className="px-4 pt-7">
      <MagazineSectionHeading eyebrow={eyebrow} title={title} />
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {items.map((item) => (
          item.authorId ? (
            <article key={`${item.href}-${item.title}`} className="w-[72%] shrink-0 rounded-[10px] border border-line/80 bg-white p-3 shadow-[0_10px_26px_rgba(17,17,17,0.035)]">
              <div className="relative">
                <Link href={item.href} className="block">
                  <MagazineImage
                    src={item.imageUrl}
                    alt={item.title}
                    variant={item.variant}
                    className={portrait ? "aspect-[4/5]" : "aspect-[16/8.5]"}
                    imageClassName={item.imageClassName}
                  />
                </Link>
                {item.imageUrl ? <FollowButton authorId={item.authorId} variant="snapOverlay" /> : null}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-blush">{item.label}</p>
                {!item.imageUrl ? <FollowButton authorId={item.authorId} variant="snapInline" /> : null}
              </div>
              <Link href={item.href} className="block">
                <h3 className="mt-1 line-clamp-2 break-words text-[0.98rem] font-black leading-snug text-ink">{item.title}</h3>
                {item.description ? <p className="mt-1.5 line-clamp-2 break-words text-xs font-medium leading-relaxed text-mute">{item.description}</p> : null}
              </Link>
            </article>
          ) : (
            <Link key={`${item.href}-${item.title}`} href={item.href} className="w-[72%] shrink-0 rounded-[10px] border border-line/80 bg-white p-3 shadow-[0_10px_26px_rgba(17,17,17,0.035)]">
              <MagazineImage
                src={item.imageUrl}
                alt={item.title}
                variant={item.variant}
                className={portrait ? "aspect-[4/5]" : "aspect-[16/8.5]"}
                imageClassName={item.imageClassName}
              />
              <p className="mt-3 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-blush">{item.label}</p>
              <h3 className="mt-1 line-clamp-2 text-[0.98rem] font-black leading-snug text-ink">{item.title}</h3>
              {item.description ? <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-relaxed text-mute">{item.description}</p> : null}
            </Link>
          )
        ))}
      </div>
    </section>
  );
}

export function MagazineCompactList({ title, eyebrow, items, actionHref }: { title: string; eyebrow?: string; items: MagazineListItem[]; actionHref?: string }) {
  if (items.length === 0) return null;

  return (
    <section className="px-4 pt-7">
      <MagazineSectionHeading eyebrow={eyebrow} title={title} actionHref={actionHref} />
      <div className="grid gap-2.5">
        {items.map((item) => (
          <Link key={`${item.href}-${item.title}`} href={item.href} className="rounded-[10px] border border-line/80 bg-white p-3 shadow-[0_8px_22px_rgba(17,17,17,0.03)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-blush">{item.label}</p>
                <h3 className="mt-1 line-clamp-2 text-[0.94rem] font-black leading-snug text-ink">{item.title}</h3>
                {item.description ? <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-mute">{item.description}</p> : null}
                {item.meta ? <p className="mt-2 text-[0.68rem] font-semibold text-mute">{item.meta}</p> : null}
              </div>
              <ChevronRight aria-hidden="true" size={16} className="mt-1 shrink-0 text-mute" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
