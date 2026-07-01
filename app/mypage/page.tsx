import { SignupRequiredCard } from "@/components/AuthGate";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { getReactionMetrics, posts } from "@/lib/mockData";

export default function MyPage() {
  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="MY PAGE"
        title="マイページ"
        body="プロフィール、保存記事、投稿履歴、本人向けの反応数を確認できます。"
      />
      <SignupRequiredCard />

      <section className="px-4 pt-5">
        <div className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
          <p className="text-[0.66rem] font-black uppercase tracking-[0.12em] text-blush">OWNER VIEW</p>
          <h2 className="mt-1 text-lg font-black text-ink">自分の投稿の反応</h2>
          <p className="mt-1 text-xs font-medium leading-relaxed text-mute">
            この数字は投稿者本人向けの管理表示です。公開カードには表示しません。
          </p>
          <div className="mt-4 grid gap-3">
            {posts.slice(0, 3).map((post) => {
              const metrics = getReactionMetrics(post);

              return (
                <div key={post.id} className="rounded-[8px] bg-neutral-50 p-3">
                  <p className="line-clamp-1 text-sm font-black text-ink">{post.body}</p>
                  <div className="mt-2 grid grid-cols-4 gap-1.5 text-center">
                    <div className="rounded-[7px] bg-white px-1.5 py-2">
                      <p className="text-[0.62rem] font-bold text-mute">グッド</p>
                      <p className="text-sm font-black text-ink">{metrics.likeCount}</p>
                    </div>
                    <div className="rounded-[7px] bg-white px-1.5 py-2">
                      <p className="text-[0.62rem] font-bold text-mute">Thanks</p>
                      <p className="text-sm font-black text-ink">{metrics.thanksCount}</p>
                    </div>
                    <div className="rounded-[7px] bg-white px-1.5 py-2">
                      <p className="text-[0.62rem] font-bold text-mute">保存</p>
                      <p className="text-sm font-black text-ink">{metrics.saveCount}</p>
                    </div>
                    <div className="rounded-[7px] bg-white px-1.5 py-2">
                      <p className="text-[0.62rem] font-bold text-mute">コメント</p>
                      <p className="text-sm font-black text-ink">{metrics.commentCount}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </PageChrome>
  );
}
