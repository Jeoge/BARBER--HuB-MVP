import { MessageCircle, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { posts } from "@/lib/mockData";
import { MagazineImage } from "./MagazineImage";

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
          <Link key={post.id} href={`/posts/${post.id}`} className="block rounded-[8px] border border-line/80 bg-white p-3 shadow-[0_8px_22px_rgba(17,17,17,0.035)]">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-ink text-[0.68rem] font-black text-white">
                  {post.authorLabel.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{post.authorLabel}</p>
                    <span className="rounded-full border border-line px-2 py-0.5 text-[0.6rem] font-semibold text-mute">
                      {post.category}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-mute">{post.area}</p>
                </div>
              </div>
              <span className="grid h-8 w-8 place-items-center rounded-full" aria-label="スナップメニュー">
                <MoreHorizontal aria-hidden="true" size={20} />
              </span>
            </div>

            <p className="line-clamp-2 text-[0.86rem] font-medium leading-relaxed text-ink">{post.body}</p>

            <MagazineImage src={post.imageUrl} alt={post.body} variant={post.accents[0]} className="mt-3 aspect-[16/9]" />

            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <span className="rounded-full border border-blush/40 bg-white px-3 py-1.5 text-xs font-semibold text-blush">
                  THANKS {post.thanks}
                </span>
                <p className="mt-1.5 text-[0.66rem] font-medium text-mute">記事じゃなくても大丈夫</p>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-mute">
                <MessageCircle aria-hidden="true" size={17} />
                {post.comments}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
