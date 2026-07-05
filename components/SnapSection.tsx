import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { posts } from "@/lib/mockData";
import { FollowButton } from "./FollowButton";
import { MagazineImage } from "./MagazineImage";
import { ProfileMiniLink } from "./ProfileMiniLink";
import { ReactionBar } from "./ReactionBar";

export function SnapSection() {
  return (
    <section className="pt-6">
      <div className="mb-3 flex items-end justify-between px-4 pr-12">
        <div>
          <p className="editorial-label text-[1.3rem] uppercase leading-none text-blush">SNAP</p>
          <p className="mt-1 text-[0.72rem] font-medium tracking-[0.08em] text-mute">TODAY&apos;S BARBER MOMENTS</p>
        </div>
        <Link href="/snap" className="pb-0.5 text-xs font-semibold text-blush">
          SNAPを見る
        </Link>
      </div>

      <div className="overflow-hidden">
        <div className="grid gap-3 px-4 pb-1">
          {posts.slice(0, 2).map((post) => (
            <article key={post.id} className="min-w-0 overflow-hidden rounded-[10px] border border-line/80 bg-white p-3 shadow-[0_10px_26px_rgba(17,17,17,0.035)]">
              <div className="mb-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <ProfileMiniLink profileId={post.profileId} fallbackName={post.authorLabel} />
                  <p className="ml-10 mt-0.5 text-xs font-medium text-mute">{post.area}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <FollowButton authorId={post.profileId} variant="snapInline" />
                    <span className="grid h-8 w-8 place-items-center rounded-full" aria-label="スナップメニュー">
                      <MoreHorizontal aria-hidden="true" size={20} />
                    </span>
                  </div>
                  <span className="max-w-[6.75rem] truncate rounded-full border border-line bg-white px-2 py-0.5 text-[0.6rem] font-semibold text-mute">{post.category}</span>
                </div>
              </div>

              <div className="mt-3">
                <Link href={`/posts/${post.id}`} className="block min-w-0">
                  <MagazineImage
                    src={post.imageUrl}
                    alt={post.body}
                    variant={post.accents[0]}
                    className="aspect-[4/5] max-h-[18rem] w-full max-w-full"
                    imageClassName="object-[center_38%]"
                  />
                </Link>
              </div>
              <Link href={`/posts/${post.id}`} className="block min-w-0">
                <p className="mt-3 line-clamp-2 break-words text-[0.86rem] font-medium leading-relaxed text-ink">{post.body}</p>
              </Link>

              <ReactionBar contentId={`post:${post.id}`} commentTitle={`${post.authorLabel}のコメント`} className="mt-3" goodIconOnly />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
