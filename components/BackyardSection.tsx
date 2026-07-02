import {
  BadgeCheck,
  Clock,
  Flag,
  LockKeyhole,
  MessageCircle,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { backyardPosts } from "@/lib/mockData";

const categories = [
  "技術",
  "道具",
  "経営",
  "集客",
  "求人",
  "学生",
  "今日の営業後",
  "ちょっと相談",
  "雑談",
];

const rules = ["理容師限定", "ニックネーム参加", "個人攻撃は禁止"];

export function BackyardSection() {
  return (
    <section className="px-4 pt-5">
      <div className="rounded-[8px] border border-blush/20 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-[0.62rem] font-black text-white">
              <LockKeyhole aria-hidden="true" size={12} />
              会員限定
            </div>
            <h2 className="mt-2 text-[1.35rem] font-black leading-none text-ink">Back Room</h2>
            <p className="mt-1 text-[0.78rem] font-black text-ink">理容師だけの、仕事終わりのコミュニティ。</p>
            <p className="mt-2 text-[0.76rem] font-medium leading-relaxed text-mute">
              技術も、道具も、経営も、今日あったことも。スレッドを立てて気軽に話せます。
            </p>
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blushSoft text-blush">
            <ShieldCheck aria-hidden="true" size={24} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {rules.map((rule) => (
            <div
              key={rule}
              className="rounded-[8px] border border-line bg-neutral-50 px-2 py-2 text-center text-[0.62rem] font-black leading-snug text-ink"
            >
              {rule}
            </div>
          ))}
        </div>

        <div className="mt-3 no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              key={category}
              className="shrink-0 rounded-full border border-line bg-white px-2.5 py-1 text-[0.66rem] font-black text-ink"
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-2">
          <Link href="/backyard/setup" className="inline-flex h-11 items-center justify-center rounded-[8px] bg-blush text-sm font-black text-white">
            Back Room用ニックネームを設定
          </Link>
          <Link href="/signup?next=/backyard/setup" className="inline-flex h-10 items-center justify-center rounded-[8px] border border-line bg-white text-xs font-black text-ink">
            未会員の方は無料登録
          </Link>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm font-black text-ink">最近のスレッド</p>
          <Link href="/post/backyard" className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[0.66rem] font-black text-ink">
            <Plus aria-hidden="true" size={13} />
            立てる
          </Link>
        </div>

        <div className="mt-2 grid gap-2.5">
          {backyardPosts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`} className="block rounded-[8px] border border-line bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-[0.82rem] font-black text-ink">{post.anonymousName}</p>
                    <span className="text-[0.7rem] font-bold text-mute">/ {post.attribute}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-blushSoft px-2 py-0.5 text-[0.6rem] font-black text-blush">
                      {post.category}
                    </span>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[0.6rem] font-black text-mute">
                      {post.status}
                    </span>
                  </div>
                </div>
                <span aria-label="通報" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-50 text-mute">
                  <Flag aria-hidden="true" size={15} />
                </span>
              </div>

              <h3 className="mt-2 text-[0.9rem] font-black leading-snug text-ink">{post.title ?? post.body}</h3>
              <p className="mt-1 line-clamp-2 text-[0.76rem] font-medium leading-relaxed text-mute">{post.body}</p>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full border border-line bg-neutral-50 px-2.5 py-1 text-[0.68rem] font-black text-ink">
                    {post.reaction}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-mute">
                    <MessageCircle aria-hidden="true" size={14} />
                    {post.comments}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[0.64rem] font-black text-mute">
                  <Clock aria-hidden="true" size={13} />
                  {post.latestCommentAt ?? "さっき"}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-3 rounded-[8px] border border-blush/20 bg-blushSoft p-3">
          <div className="flex items-center gap-2 text-[0.78rem] font-black text-ink">
            <BadgeCheck aria-hidden="true" size={17} className="text-blush" />
            軽く話せて、礼儀は守る
          </div>
          <p className="mt-1.5 text-[0.72rem] font-medium leading-relaxed text-mute">
            表プロフィールとは別のニックネームで参加できます。店名や本名を出さずに話せますが、個人攻撃や晒しは禁止です。
          </p>
        </div>
      </div>
    </section>
  );
}
