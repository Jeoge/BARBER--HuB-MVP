import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { ARTICLE_TOPIC_NAV, type ArticleTopicSlug } from "@/lib/articleCategories";

type ArticleThemeLinksProps = {
  currentSlug?: ArticleTopicSlug | null;
  title?: string;
};

export function ArticleThemeLinks({ currentSlug, title = "ほかのテーマ" }: ArticleThemeLinksProps) {
  return (
    <section className="px-4 pt-6" aria-label={title}>
      <h2 className="text-sm font-black text-ink">{title}</h2>
      <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {ARTICLE_TOPIC_NAV.map((topic) => {
          const active = topic.slug === currentSlug;
          const className =
            "inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-full px-3 text-xs font-black " +
            (active ? "bg-blush text-white" : "border border-line bg-white text-ink");

          return (
            <Link key={topic.slug} href={topic.href} className={`pressable ${className}`} aria-current={active ? "page" : undefined}>
              {topic.label}
              {!active ? <ChevronRight aria-hidden="true" size={13} className="text-mute" /> : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
