import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { FollowButton } from "@/components/FollowButton";
import { MagazineImage } from "@/components/MagazineImage";
import { ReactionBar } from "@/components/ReactionBar";
import { snapAuthorMeta, snapAuthorName, snapDateLabel, type SnapWithAuthor } from "@/lib/supabase/snaps";

function initial(name: string) {
  return name.trim().slice(0, 1).toUpperCase();
}

export function SnapCard({ snap, compact = false }: { snap: SnapWithAuthor; compact?: boolean }) {
  const authorName = snapAuthorName(snap);
  const authorMeta = snapAuthorMeta(snap);
  const caption = snap.caption ?? "";
  const hasImage = Boolean(snap.image_url);

  return (
    <article className="min-w-0 overflow-hidden rounded-[10px] border border-line/80 bg-white p-3 shadow-[0_10px_26px_rgba(17,17,17,0.035)]">
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex min-w-0 items-center gap-2 rounded-full pr-1">
            <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-ink text-[0.68rem] font-black text-white">
              {snap.profiles?.avatar_url ? <img src={snap.profiles.avatar_url} alt="" className="h-full w-full object-cover" /> : initial(authorName)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-tight text-ink">{authorName}</span>
              {authorMeta ? <span className="mt-0.5 block truncate text-[0.62rem] font-semibold text-mute">{authorMeta}</span> : null}
            </span>
          </div>
          <p className="ml-10 mt-0.5 text-xs font-medium text-mute">{snapDateLabel(snap)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex items-center justify-end gap-1.5">
            <FollowButton authorId={snap.author_id} variant="snapInline" />
            <span className="grid h-8 w-8 place-items-center rounded-full" aria-label="スナップメニュー">
              <MoreHorizontal aria-hidden="true" size={20} />
            </span>
          </div>
          <span className="max-w-[6.75rem] truncate rounded-full border border-line bg-white px-2 py-0.5 text-[0.6rem] font-semibold text-mute">
            {snap.category ?? "日常"}
          </span>
        </div>
      </div>

      {hasImage ? (
        <div className="mt-3">
          <Link href={`/posts/${snap.id}`} className="block min-w-0">
            <MagazineImage
              src={snap.image_url ?? undefined}
              alt={caption}
              variant="news"
              className={(compact ? "max-h-[18rem] " : "") + "aspect-[4/5] w-full max-w-full"}
              imageClassName="object-[center_38%]"
            />
          </Link>
        </div>
      ) : (
        <Link href={`/posts/${snap.id}`} className="mt-3 block rounded-[8px] border border-line bg-neutral-50 p-4">
          <p className="text-xs font-black text-blush">TEXT SNAP</p>
          <p className="mt-2 line-clamp-5 break-words text-sm font-medium leading-relaxed text-ink">{caption}</p>
        </Link>
      )}

      {hasImage ? (
        <Link href={`/posts/${snap.id}`} className="block min-w-0">
          <p className="mt-3 line-clamp-2 break-words text-[0.86rem] font-medium leading-relaxed text-ink">{caption}</p>
        </Link>
      ) : null}

      <ReactionBar contentId={`snap:${snap.id}`} commentTitle={`${authorName}のコメント`} className="mt-3" goodIconOnly />
      <p className="mt-2 text-[0.66rem] font-semibold text-mute">Thanks・コメント・保存は現在テスト表示です。</p>
    </article>
  );
}
