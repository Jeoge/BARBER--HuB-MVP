import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { MagazineImage } from "@/components/MagazineImage";
import { MagazinePageHeader, MagazineRail, MagazineSectionHeading } from "@/components/MagazineListLayout";
import { PageChrome } from "@/components/PageChrome";
import { ProfileMiniLink } from "@/components/ProfileMiniLink";
import { ReactionBar } from "@/components/ReactionBar";
import { posts } from "@/lib/mockData";

export default function SnapPage() {
  return (
    <PageChrome>
      <MagazinePageHeader
        eyebrow="SNAP"
        title="SNAP"
        description="理容師の日常と気づきを切り取る。写真から、技術・道具・営業の空気が見えてくる。"
        tags={["技術", "道具", "営業メモ", "日常", "編集部へ共有"]}
      />

      <MagazineRail
        title="今日の一枚"
        eyebrow="PICK"
        portrait
        items={posts.slice(0, 3).map((post) => ({
          href: `/posts/${post.id}`,
          label: post.category,
          title: post.body,
          description: `${post.authorLabel} / ${post.area}`,
          imageUrl: post.imageUrl,
          variant: post.accents[0],
          imageClassName: "object-[center_38%]",
        }))}
      />

      <section className="px-4 pt-7">
        <MagazineSectionHeading eyebrow="LATEST" title="新着Snap" />
        <div className="grid gap-3">
          {posts.map((post) => (
            <article key={post.id} className="rounded-[10px] border border-line/80 bg-white p-3 shadow-[0_10px_26px_rgba(17,17,17,0.035)]">
              <div className="mb-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <ProfileMiniLink profileId={post.profileId} fallbackName={post.authorLabel} />
                  <p className="ml-10 mt-0.5 text-xs font-bold text-mute">{post.area}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="rounded-full bg-blushSoft px-2 py-0.5 text-[0.6rem] font-black text-blush">
                    {post.category}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-50 px-2 py-1 text-[0.58rem] font-black text-mute">
                    <ShieldCheck aria-hidden="true" size={12} className="text-blush" />
                    {post.source}
                  </span>
                </div>
              </div>
              <Link href={`/posts/${post.id}`} className="block">
                <MagazineImage
                  src={post.imageUrl}
                  alt={post.body}
                  variant={post.accents[0]}
                  className="mt-3 aspect-[4/5]"
                  imageClassName="object-[center_38%]"
                />
                <p className="mt-3 line-clamp-2 text-[0.9rem] font-medium leading-relaxed text-ink">{post.body}</p>
              </Link>
              <ReactionBar contentId={`post:${post.id}`} commentTitle={`${post.authorLabel}のコメント`} className="mt-3" goodIconOnly />
            </article>
          ))}
        </div>
      </section>
    </PageChrome>
  );
}
