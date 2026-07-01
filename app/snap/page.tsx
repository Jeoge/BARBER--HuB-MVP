import { MessageCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { MagazineImage } from "@/components/MagazineImage";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { posts } from "@/lib/mockData";

export default function SnapPage() {
  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="SNAP"
        title="SNAP"
        body="理容師の日常と気づきを切り取る。記事にするほどではない小さな発見や営業メモを、気軽に共有できます。"
      />
      <section className="px-4 pt-4">
        <div className="grid gap-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`} className="block rounded-[8px] border border-line bg-white p-3 shadow-sm">
              <div className="mb-2.5 flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-black text-ink">{post.authorLabel}</p>
                    <span className="rounded-full bg-blushSoft px-2 py-0.5 text-[0.6rem] font-black text-blush">
                      {post.category}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-bold text-mute">{post.area}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-50 px-2 py-1 text-[0.58rem] font-black text-mute">
                  <ShieldCheck aria-hidden="true" size={12} className="text-blush" />
                  {post.source}
                </span>
              </div>
              <p className="text-[0.86rem] font-medium leading-relaxed text-ink">{post.body}</p>
              <MagazineImage src={post.imageUrl} alt={post.body} variant={post.accents[0]} className="mt-3 aspect-[16/9]" />
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <span className="rounded-full bg-blush px-3 py-1.5 text-xs font-black text-white">
                    THANKS {post.thanks}
                  </span>
                  <p className="mt-1.5 text-[0.66rem] font-bold text-mute">小さな気づきが、誰かのヒントになる</p>
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
    </PageChrome>
  );
}
