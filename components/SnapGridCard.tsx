import Link from "next/link";
import { ProfileMiniLink } from "@/components/ProfileMiniLink";
import { SnapImageCarousel } from "@/components/SnapImageCarousel";
import {
  snapAuthorMeta,
  snapAuthorName,
  snapDateLabel,
  snapDisplayImages,
  type SnapWithAuthor,
} from "@/lib/supabase/snaps";

export function SnapGridCard({ snap }: { snap: SnapWithAuthor }) {
  const authorName = snapAuthorName(snap);
  const authorMeta = snapAuthorMeta(snap);
  const caption = snap.caption ?? "";
  const images = snapDisplayImages(snap);
  const postHref = `/posts/${snap.id}`;
  const authorHref = `/profiles/${snap.author_id}`;
  const dateLabel = snapDateLabel(snap);

  return (
    <article className="min-w-0 overflow-hidden rounded-[10px] border border-line/80 bg-white shadow-[0_8px_22px_rgba(17,17,17,0.03)]">
      {images.length > 0 ? (
        <SnapImageCarousel
          images={images}
          alt={caption || "Snap画像"}
          href={postHref}
          variant="news"
          className="aspect-square w-full max-w-full"
          compactIndicators
        />
      ) : (
        <Link
          href={postHref}
          prefetch={false}
          className="flex aspect-square w-full min-w-0 flex-col justify-between overflow-hidden bg-gradient-to-br from-white via-neutral-50 to-blushSoft p-3"
          aria-label="画像なしSnapの詳細を見る"
        >
          <p className="text-[0.64rem] font-black tracking-[0.08em] text-blush">TEXT SNAP</p>
          <p className="line-clamp-3 break-words text-xs font-semibold leading-relaxed text-ink">
            {caption || "画像なしのSnapです。"}
          </p>
        </Link>
      )}

      <div className="min-w-0 p-2.5">
        <ProfileMiniLink
          profileId={snap.author_id}
          fallbackName={authorName}
          avatarUrl={snap.profiles?.avatar_url}
          meta={authorMeta}
          href={authorHref}
          size="feed"
          className="w-full max-w-full"
        />

        {caption ? (
          <Link href={postHref} prefetch={false} className="mt-2 block min-w-0">
            <p className="line-clamp-2 break-words text-xs font-medium leading-relaxed text-ink">{caption}</p>
          </Link>
        ) : null}

        <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[0.64rem] font-semibold leading-tight text-mute">
          <span className="min-w-0 truncate">{snap.category ?? "日常"}</span>
          <span aria-hidden="true" className="shrink-0 text-line">
            /
          </span>
          <time dateTime={snap.created_at ?? undefined} className="shrink-0">
            {dateLabel}
          </time>
        </div>
      </div>
    </article>
  );
}
