import { Flag, LockKeyhole, MessageCircle, ShieldCheck, UserRoundPlus } from "lucide-react";
import Link from "next/link";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { backyardPosts } from "@/lib/mockData";

const categories = ["価格改定", "一人営業", "SNS疲れ", "スタッフ", "技術の不安", "今日だけ聞いてほしい"];

export default function BackyardPage() {
  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="BARBER BACKYARD"
        title="理容師だけのバックヤード。"
        body="表では学び、裏では本音を話す。Backyardでは、表のプロフィールとは別の名前で投稿できます。"
      />

      <section className="px-4 pt-4">
        <div className="rounded-[8px] border border-blush/20 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blushSoft text-blush">
              <UserRoundPlus aria-hidden="true" size={22} />
            </div>
            <div>
              <h2 className="text-base font-black text-ink">Backyard入口カード</h2>
              <p className="mt-1 text-sm font-medium leading-relaxed text-mute">
                匿名ニックネームを設定すると、表の自分とは別の名前で本音を話せます。
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            <Link href="/backyard/setup" className="inline-flex h-12 items-center justify-center rounded-[8px] bg-blush text-sm font-black text-white">
              匿名ニックネームを設定して入る
            </Link>
            <Link href="/signup?next=/backyard/setup" className="inline-flex h-11 items-center justify-center rounded-[8px] border border-line bg-white text-sm font-black text-ink">
              未会員の方は無料登録
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pt-5">
        <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-3">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <ShieldCheck aria-hidden="true" size={18} className="text-blush" />
            本音を話せる場所ですが、荒れる場所にはしません。
          </div>
          <p className="mt-1.5 text-xs font-medium leading-relaxed text-mute">
            個人名・店舗名を出した攻撃や晒しは禁止です。
          </p>
        </div>
      </section>

      <section className="px-4 pt-5">
        <h2 className="text-base font-black text-ink">匿名カテゴリ</h2>
        <div className="mt-3 no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <span key={category} className="shrink-0 rounded-full border border-line bg-white px-3 py-2 text-xs font-black text-ink">
              {category}
            </span>
          ))}
        </div>
      </section>

      <section className="px-4 pt-5">
        <h2 className="text-base font-black text-ink">匿名スレッドの雰囲気</h2>
        <div className="mt-3 grid gap-2.5">
          {backyardPosts.map((post) => (
            <article key={post.id} className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-black text-ink">{post.anonymousName}</p>
                    <span className="text-xs font-bold text-mute">/ {post.attribute}</span>
                  </div>
                  <span className="mt-1.5 inline-flex rounded-full bg-blushSoft px-2 py-0.5 text-[0.62rem] font-black text-blush">
                    {post.category}
                  </span>
                </div>
                <button aria-label="通報" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-50 text-mute">
                  <Flag aria-hidden="true" size={15} />
                </button>
              </div>
              <p className="mt-2 text-[0.82rem] font-medium leading-relaxed text-ink">{post.body}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-blush px-3 py-1.5 text-[0.68rem] font-black text-white">
                  共感 {post.empathy}
                </span>
                <span className="inline-flex items-center gap-1 text-[0.72rem] font-bold text-mute">
                  <MessageCircle aria-hidden="true" size={14} />
                  {post.comments}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 pt-5">
        <div className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <LockKeyhole aria-hidden="true" size={18} className="text-blush" />
            表のプロフィールとは別物です
          </div>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
            Backyardではプロフィール写真や表の名前を表示しません。匿名ニックネームと属性タグだけで参加します。
          </p>
        </div>
      </section>
    </PageChrome>
  );
}
