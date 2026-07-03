import {
  ArrowRight,
  Clock,
  LockKeyhole,
  MessageCircle,
  UserRoundPlus,
} from "lucide-react";
import Link from "next/link";
import { backyardPosts } from "@/lib/mockData";

const categories = ["九州・沖縄", "経営", "独立", "道具", "趣味"];

const entryBadges = ["会員限定", "ニックネーム参加", "営業後トーク"];

export function BackyardSection() {
  const recentTopics = backyardPosts.slice(0, 3);

  return (
    <section className="px-4 pt-5">
      <div className="rounded-[8px] border border-line/80 bg-white p-4 shadow-[0_12px_32px_rgba(17,17,17,0.045)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-neutral-50 px-2.5 py-1 text-[0.62rem] font-black text-ink">
              <LockKeyhole aria-hidden="true" size={12} />
              会員限定
            </div>
            <h2 className="mt-2 text-[1.28rem] font-black leading-none text-ink">Back Room</h2>
            <p className="mt-1 text-[0.78rem] font-black text-ink">理容師だけの、営業後コミュニティ。</p>
          </div>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blushSoft text-blush">
            <MessageCircle aria-hidden="true" size={21} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {entryBadges.map((badge) => (
            <span key={badge} className="rounded-full bg-neutral-50 px-2.5 py-1 text-[0.62rem] font-black text-mute">
              {badge}
            </span>
          ))}
        </div>

        <div className="mt-3 no-scrollbar flex gap-1.5 overflow-x-auto pb-1" aria-label="Back Roomカテゴリ">
          {categories.map((category) => (
            <span
              key={category}
              className="shrink-0 rounded-full border border-line bg-white px-2.5 py-1 text-[0.66rem] font-black text-ink"
            >
              {category}
            </span>
          ))}
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-black text-ink">最近の話題</p>
            <p className="text-[0.66rem] font-bold text-mute">中で読めます</p>
          </div>
          <div className="grid gap-2">
            {recentTopics.map((post) => (
              <Link
                key={post.id}
                href={`/backyard/setup?next=/posts/${post.id}`}
                className="block rounded-[8px] border border-line/80 bg-white px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className="shrink-0 rounded-full bg-blushSoft px-2 py-0.5 text-[0.6rem] font-black text-blush">
                    {post.category}
                  </span>
                  <h3 className="min-w-0 flex-1 truncate text-[0.82rem] font-black text-ink">{post.title ?? post.body}</h3>
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-[0.68rem] font-bold text-mute">
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle aria-hidden="true" size={13} />
                    {post.comments}コメント
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock aria-hidden="true" size={13} />
                    {post.latestCommentAt ?? "さっき"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <Link href="/backyard/setup?next=/backyard" className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[8px] bg-ink px-4 text-sm font-black text-white">
            Back Roomを見る
            <ArrowRight aria-hidden="true" size={15} />
          </Link>
          <Link
            href="/backyard/setup"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[8px] border border-line bg-white text-ink"
            aria-label="Back Room用ニックネームを設定する"
          >
            <UserRoundPlus aria-hidden="true" size={18} />
          </Link>
        </div>

        <Link href="/backyard/setup" className="mt-2 inline-flex text-[0.68rem] font-bold text-mute">
          ニックネーム未設定の方は参加設定へ
        </Link>
      </div>
    </section>
  );
}
