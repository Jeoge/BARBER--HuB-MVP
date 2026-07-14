import Link from "next/link";
import { SnapCard } from "@/components/SnapCard";
import { MagazinePageHeader, MagazineRail, MagazineSectionHeading } from "@/components/MagazineListLayout";
import { PageChrome } from "@/components/PageChrome";
import { createClient } from "@/lib/supabase/server";
import { listPublishedSnaps, primarySnapImageUrl, snapAuthorMeta, snapAuthorName } from "@/lib/supabase/snaps";

type SnapPageProps = {
  searchParams?: Promise<{ posted?: string }>;
};

export default async function SnapPage({ searchParams }: SnapPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { snaps, error } = await listPublishedSnaps(supabase, 30, user?.id);
  const featuredSnaps = snaps.filter((snap) => primarySnapImageUrl(snap)).slice(0, 3);

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
        items={featuredSnaps.map((snap) => ({
          href: `/posts/${snap.id}`,
          label: snap.category ?? "日常",
          title: snap.caption ?? "",
          description: [snapAuthorName(snap), snapAuthorMeta(snap)].filter(Boolean).join(" / "),
          imageUrl: primarySnapImageUrl(snap) ?? undefined,
          variant: "news",
          imageClassName: "object-[center_38%]",
        }))}
      />

      <section className="px-4 pt-7">
        <MagazineSectionHeading eyebrow="LATEST" title="新着Snap" />
        {params?.posted === "1" ? (
          <div className="mb-3 rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-sm font-black leading-relaxed text-ink">
            投稿できました
          </div>
        ) : null}
        {error ? (
          <div className="rounded-[8px] border border-line bg-white p-4 text-sm font-bold leading-relaxed text-mute shadow-sm">
            Snapを読み込めませんでした。時間をおいて再読み込みしてください。
          </div>
        ) : snaps.length === 0 ? (
          <div className="rounded-[10px] border border-line bg-white p-4 shadow-sm">
            <p className="text-sm font-black text-ink">まだSnap投稿はありません</p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-mute">現場の気づきや日常を、最初のSnapとして投稿できます。</p>
            <Link href="/post/snap" className="mt-3 inline-flex h-10 items-center justify-center rounded-[8px] bg-ink px-4 text-xs font-black text-white">
              最初のSnapを投稿する
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {snaps.map((snap) => (
              <SnapCard key={snap.id} snap={snap} currentUserId={user?.id} />
            ))}
          </div>
        )}
      </section>
    </PageChrome>
  );
}
