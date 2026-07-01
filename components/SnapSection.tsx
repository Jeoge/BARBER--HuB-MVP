import { MessageCircle, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { posts } from "@/lib/mockData";
import { VisualTile } from "./VisualTile";

export function SnapSection() {
  return (
    <section className="pt-2">
      <div className="mb-1.5 flex items-end justify-between px-4 pr-16">
        <div>
          <h2 className="text-[0.96rem] font-black text-ink">みんなのスナップ</h2>
          <p className="mt-0.5 text-[0.68rem] font-bold text-mute">
            全国の理容師が切り取った日常の1コマ
          </p>
        </div>
        <Link href="/snap" className="text-xs font-bold text-blush">
          SNAPを見る
        </Link>
      </div>

      <div className="grid gap-3 px-4">
        {posts.slice(0, 3).map((post) => (
          <Link key={post.id} href={`/posts/${post.id}`} className="block rounded-[8px] border border-line bg-white p-3 shadow-sm">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-ink text-xs font-black text-white">
                  {post.authorLabel.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-ink">{post.authorLabel}</p>
                    <span className="rounded-full bg-blushSoft px-2 py-0.5 text-[0.62rem] font-black text-blush">
                      {post.category}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-mute">{post.area}</p>
                </div>
              </div>
              <span className="grid h-8 w-8 place-items-center rounded-full" aria-label="スナップメニュー">
                <MoreHorizontal aria-hidden="true" size={20} />
              </span>
            </div>

            <p className="line-clamp-2 text-[0.86rem] font-medium leading-relaxed text-ink">{post.body}</p>

            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {post.accents.map((accent, index) => (
                <VisualTile key={`${post.id}-${accent}-${index}`} variant={accent} className="aspect-square" />
              ))}
            </div>

            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <span className="rounded-full bg-blush px-3 py-1.5 text-xs font-black text-white">
                  THANKS {post.thanks}
                </span>
                <p className="mt-1.5 text-[0.66rem] font-bold text-mute">記事じゃなくても大丈夫</p>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-bold text-mute">
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
