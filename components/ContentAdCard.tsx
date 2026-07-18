import { ExternalLink } from "lucide-react";
import { MagazineImage } from "@/components/MagazineImage";
import type { ContentAd } from "@/lib/supabase/content-ads";

type ContentAdCardProps = {
  ad: ContentAd | null;
};

export function ContentAdCard({ ad }: ContentAdCardProps) {
  if (ad == null) return null;

  return (
    <section className="px-4 pt-6">
      <a
        href={ad.destination_url}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className="block rounded-[8px] border border-blush/20 bg-white p-3 shadow-[0_8px_22px_rgba(17,17,17,0.035)]"
      >
        <div className="flex items-start gap-3">
          {ad.image_url ? (
            <div className="w-24 shrink-0">
              <MagazineImage src={ad.image_url} alt={ad.title} variant="tool" className="aspect-[4/3]" />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full border border-blush/20 bg-blushSoft px-2 py-0.5 text-[0.58rem] font-black text-blush">
                {ad.disclosure_label}
              </span>
              <span className="truncate text-[0.62rem] font-bold text-mute">{ad.advertiser_name}</span>
            </div>
            <h2 className="mt-1.5 line-clamp-2 text-sm font-black leading-snug text-ink">{ad.title}</h2>
            <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-mute">{ad.short_text}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-black text-blush">
              {ad.cta_label}
              <ExternalLink aria-hidden="true" size={12} />
            </span>
          </div>
        </div>
      </a>
    </section>
  );
}
