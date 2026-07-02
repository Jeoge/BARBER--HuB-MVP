import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { posts } from "@/lib/mockData";
import { MagazineImage } from "./MagazineImage";
import { ProfileMiniLink } from "./ProfileMiniLink";
import { ReactionBar } from "./ReactionBar";

export function SnapSection() {
  return (
    <section className="pt-8">
      <div className="mb-3 flex items-end justify-between px-4 pr-16">
        <div>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-blush">SNAP</p>
          <h2 className="mt-1 text-[1rem] font-black text-ink">みんなのスナップ</h2>
        </div>
        <Link href="/snap" className="text-xs font-semibold text-blush">
          SNAPを見る
        </Link>
      </div>

      <div className="grid gap-4 px-4">
        {posts.slice(0, 3).map((post) => (
          <article key={post.id} className="rounded-[8px] border border-line/80 bg-white p-3 shadow-[0_8px_22px_rgba(17,17,17,0.035)]">
            <div className="mb-3 flex items-center justify-between">
              <div className="min-w-0">
                <ProfileMiniLink profileId={post.profileId} fallbackName={post.authorLabel} />
                <p className="ml-10 mt-0.5 text-xs font-medium text-mute">{post.area}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full border border-line px-2 py-0.5 text-[0.6rem] font-semibold text-mute">
                  {post.category}
                </span>
                <span className="grid h-8 w-8 place-items-center rounded-full" aria-label="スナップメニュー">
                  <MoreHorizontal aria-hidden="true" size={20} />
                </span>
              </div>
            </div>

            <Link href={`/posts/${post.id}`} className="block">
              <p className="line-clamp-2 text-[0.86rem] font-medium leading-relaxed text-ink">{post.body}</p>
              <MagazineImage src={post.imageUrl} alt={post.body} variant={post.accents[0]} className="mt-3 aspect-[16/9]" />
            </Link>

            <ReactionBar contentId={`post:${post.id}`} commentTitle={`${post.authorLabel}のコメント`} className="mt-3" />
            <p className="mt-2 text-[0.66rem] font-medium text-mute">記事じゃなくても大丈夫。小さな気づきが誰かのヒントに。</p>
          </article>
        ))}
      </div>
    </section>
  );
}
