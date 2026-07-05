import Link from "next/link";
import { listPublishedSnaps } from "@/lib/supabase/snaps";
import { createClient } from "@/lib/supabase/server";
import { SnapCard } from "./SnapCard";

export async function SnapSection() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { snaps, error } = await listPublishedSnaps(supabase, 2);

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
        {error ? (
          <div className="px-4">
            <div className="rounded-[8px] border border-line bg-white p-4 text-xs font-bold leading-relaxed text-mute">
              Snapを読み込めませんでした。
            </div>
          </div>
        ) : snaps.length === 0 ? (
          <div className="px-4">
            <div className="rounded-[10px] border border-line bg-white p-4 shadow-sm">
              <p className="text-sm font-black text-ink">まだSnap投稿はありません</p>
              <p className="mt-1 text-xs font-medium leading-relaxed text-mute">最初のSnapを投稿して、現場の気づきを共有できます。</p>
              <Link href="/post/snap" className="mt-3 inline-flex h-10 items-center justify-center rounded-[8px] bg-ink px-4 text-xs font-black text-white">
                最初のSnapを投稿する
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 px-4 pb-1">
            {snaps.map((snap) => (
              <SnapCard key={snap.id} snap={snap} compact currentUserId={user?.id} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
