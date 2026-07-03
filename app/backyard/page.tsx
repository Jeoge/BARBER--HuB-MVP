import { Clock, Flag, LockKeyhole, MessageCircle, Plus, ShieldCheck, UserRoundPlus } from "lucide-react";
import Link from "next/link";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { backyardPosts } from "@/lib/mockData";

const categories = ["九州・沖縄", "関東", "関西", "中部", "経営", "独立", "技術・道具", "求人・スタッフ", "趣味", "雑談"];

const threadPolicies = [
  "初期表示は20コメント。もっと見るで20件ずつ表示します。",
  "1スレッド100コメントを目安に、続きスレッド作成を案内します。",
  "不適切評価が集まった投稿は折りたたみ、運営確認後に一時非表示を判断します。",
];

export default function BackyardPage() {
  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="BACK ROOM"
        title="Back Room"
        body="理容師・理容業界の人が、仕事終わりに話せるスレッド型コミュニティ。カテゴリを選んで部屋に入り、落ち着いて会話できます。"
      />

      <section className="px-4 pt-4">
        <div className="rounded-[8px] border border-blush/20 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blushSoft text-blush">
              <UserRoundPlus aria-hidden="true" size={22} />
            </div>
            <div>
              <h2 className="text-base font-black text-ink">Back Roomに入る</h2>
              <p className="mt-1 text-sm font-medium leading-relaxed text-mute">
                表プロフィールとは別のニックネームで参加できます。MVPでは免許証アップロードを求めず、自己申告・職種選択・ルール同意から始めます。
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            <Link href="/backyard/setup" className="inline-flex h-12 items-center justify-center rounded-[8px] bg-blush text-sm font-black text-white">
              Back Room用ニックネームを設定
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
            気軽に話せる場所ですが、荒れる場所にはしません。
          </div>
          <p className="mt-1.5 text-xs font-medium leading-relaxed text-mute">
            店名や本名を出さずに話せますが、個人名・店舗名を出した攻撃や晒しは禁止です。
          </p>
        </div>
      </section>

      <section className="px-4 pt-5">
        <h2 className="text-base font-black text-ink">部屋を選ぶ</h2>
        <div className="mt-3 no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <Link key={category} href="#threads" className="shrink-0 rounded-full border border-line bg-white px-3 py-2 text-xs font-black text-ink">
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 pt-4">
        <div className="rounded-[8px] border border-line bg-white p-3">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <ShieldCheck aria-hidden="true" size={18} className="text-blush" />
            スレッド型で運用します
          </div>
          <div className="mt-2 grid gap-1.5">
            {threadPolicies.map((policy) => (
              <p key={policy} className="text-xs font-medium leading-relaxed text-mute">
                {policy}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section id="threads" className="px-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-black text-ink">スレッド</h2>
          <Link href="/post/backyard" className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-ink px-3 text-xs font-black text-white">
            <Plus aria-hidden="true" size={14} />
            スレッドを立てる
          </Link>
        </div>
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
              <h3 className="mt-2 text-[0.96rem] font-black leading-snug text-ink">{post.title ?? post.body}</h3>
              <p className="mt-1 text-[0.82rem] font-medium leading-relaxed text-mute">{post.body}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="rounded-full border border-line bg-neutral-50 px-2.5 py-1 text-[0.68rem] font-black text-ink">
                  {post.reaction}
                </span>
                <div className="flex items-center gap-3 text-[0.72rem] font-bold text-mute">
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle aria-hidden="true" size={14} />
                    {post.comments}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock aria-hidden="true" size={14} />
                    {post.latestCommentAt ?? "さっき"}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 pt-5">
        <div className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <LockKeyhole aria-hidden="true" size={18} className="text-blush" />
            表プロフィールとは別のニックネームで参加できます
          </div>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
            Back Roomではプロフィール写真や表の名前を表示しません。ニックネームと属性タグだけで参加できます。
          </p>
        </div>
      </section>
    </PageChrome>
  );
}
