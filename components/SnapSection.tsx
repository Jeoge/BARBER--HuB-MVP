import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { posts } from "@/lib/mockData";
import { MagazineImage } from "./MagazineImage";
import { ProfileMiniLink } from "./ProfileMiniLink";
import { ReactionBar } from "./ReactionBar";

export function SnapSection() {
  return (
    <section className="pt-6">
      <div className="mb-3 flex items-end justify-between px-4 pr-12">
        <div>
          <p className="editorial-label text-[1.1rem] uppercase text-blush">SNAP</p>
          <p className="mt-1 text-[0.72rem] font-medium tracking-[0.08em] text-mute">TODAY&apos;S BARBER MOMENTS</p>
        </div>
        <Link href="/snap" className="pb-0.5 text-xs font-semibold text-blush">
          SNAPを見る
        </Link>
      </div>

      <div className="relative max-h-[76rem] overflow-hidden">
        <div className="grid gap-4 px-4 pb-8">
          {posts.slice(0, 3).map((post) => (
            <article key={post.id} className="rounded-[10px] border border-line/80 bg-white p-3 shadow-[0_14px_32px_rgba(17,17,17,0.045)]">
              <div className="mb-3 flex items-center justify-between">
                <div className="min-w-0">
                  <ProfileMiniLink profileId={post.profileId} fallbackName={post.authorLabel} />
                  <p className="ml-10 mt-0.5 text-xs font-medium text-mute">{post.area}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full border border-line bg-white px-2 py-0.5 text-[0.6rem] font-semibold text-mute">{post.category}</span>
                  <span className="grid h-8 w-8 place-items-center rounded-full" aria-label="スナップメニュー">
                    <MoreHorizontal aria-hidden="true" size={20} />
                  </span>
                </div>
              </div>

              <Link href={`/posts/${post.id}`} className="block">
                <MagazineImage
                  src={post.imageUrl}
                  alt={post.body}
                  variant={post.accents[0]}
                  className="aspect-[4/5]"
                  imageClassName="object-[center_38%]"
                />
                <p className="mt-3 truncate text-[0.86rem] font-medium leading-relaxed text-ink">{post.body}</p>
              </Link>

              <ReactionBar contentId={`post:${post.id}`} commentTitle={`${post.authorLabel}のコメント`} className="mt-3" goodIconOnly />
            </article>
          ))}
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/88 to-white/0 backdrop-blur-[1px]" />
      </div>
    </section>
  );
}
