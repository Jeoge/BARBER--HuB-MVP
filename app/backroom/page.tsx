import { LockKeyhole, MessageCircle, Plus, UserRound } from "lucide-react";
import Link from "next/link";
import { SignupRequiredCard } from "@/components/AuthGate";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import {
  BACKROOM_CATEGORIES,
  backroomAuthorMeta,
  backroomAuthorName,
  backroomDateLabel,
  backroomExcerpt,
  listBackroomPosts,
  type BackroomPostWithAuthor,
} from "@/lib/supabase/backroom";
import { createClient } from "@/lib/supabase/server";

type BackroomPageProps = {
  searchParams?: Promise<{ posted?: string }>;
};

function AuthorLine({ post }: { post: BackroomPostWithAuthor }) {
  const name = backroomAuthorName(post);
  const meta = backroomAuthorMeta(post);

  return (
    <Link href={`/profiles/${post.user_id}`} className="mt-3 flex min-w-0 items-center gap-2">
      <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-ink text-[0.68rem] font-black text-white">
        {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} alt="" className="h-full w-full object-cover" /> : name.slice(0, 1)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-black text-ink">{name}</span>
        {meta ? <span className="mt-0.5 block truncate text-[0.64rem] font-semibold text-mute">{meta}</span> : null}
      </span>
    </Link>
  );
}

function BackroomCard({ post }: { post: BackroomPostWithAuthor }) {
  return (
    <article className="rounded-[10px] border border-line bg-white p-4 shadow-sm">
      <Link href={`/backroom/${post.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full bg-blushSoft px-2.5 py-1 text-[0.66rem] font-black text-blush">{post.category}</span>
          <span className="shrink-0 text-[0.66rem] font-bold text-mute">{backroomDateLabel(post)}</span>
        </div>
        <h2 className="mt-3 line-clamp-2 text-[1rem] font-black leading-snug text-ink">{post.title}</h2>
        <p className="mt-2 line-clamp-3 text-sm font-medium leading-relaxed text-mute">{backroomExcerpt(post.body, 110)}</p>
      </Link>
      <div className="mt-3 flex items-center justify-between gap-3">
        <AuthorLine post={post} />
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-neutral-50 px-2.5 py-1 text-[0.66rem] font-black text-mute">
          <MessageCircle aria-hidden="true" size={13} />
          {post.comment_count}
        </span>
      </div>
    </article>
  );
}

export default async function BackroomPage({ searchParams }: BackroomPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
    return (
      <PageChrome>
        <PageHeaderBlock
          eyebrow="BACK ROOM"
          title="Back Room"
          body="理美容業界の営業後コミュニティ。営業後に、少しだけ本音で話せる会員限定の場所です。"
        />
        <SignupRequiredCard kind="backyard" />
      </PageChrome>
    );
  }

  const { posts, error } = await listBackroomPosts(supabase, 40);

  return (
    <PageChrome>
      <section className="px-4 pt-5">
        <div className="rounded-[10px] bg-ink p-4 text-white">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[0.64rem] font-black">
            <LockKeyhole aria-hidden="true" size={12} />
            会員限定
          </div>
          <h1 className="editorial-serif mt-3 text-[1.8rem] leading-tight">Back Room</h1>
          <p className="mt-2 text-[0.88rem] font-semibold leading-relaxed text-white/72">理美容業界の営業後コミュニティ</p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-white/68">
            営業後に、少しだけ本音で話せる場所。経営、技術、独立、スタッフ、集客、学生、アシスタント、趣味の話を気軽に残せます。
          </p>
          <Link href="/post/backroom" className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-blush text-sm font-black text-white">
            <Plus aria-hidden="true" size={17} />
            Back Roomに投稿
          </Link>
        </div>
      </section>

      <section className="px-4 pt-4">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          {BACKROOM_CATEGORIES.map((category) => (
            <span key={category} className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-[0.66rem] font-black text-ink/76">
              {category}
            </span>
          ))}
        </div>
      </section>

      <section className="grid gap-3 px-4 pt-4">
        {params?.posted === "1" ? (
          <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-sm font-black text-ink">投稿しました。</div>
        ) : null}
        {error ? (
          <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
            Back Roomを読み込めませんでした。Supabase SQL Editorで最新migrationが適用済みか確認してください。
          </div>
        ) : null}
        {posts.length === 0 ? (
          <div className="rounded-[10px] border border-line bg-white p-4 shadow-sm">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-blushSoft text-blush">
              <UserRound aria-hidden="true" size={19} />
            </div>
            <h2 className="mt-3 text-base font-black text-ink">まだBack Room投稿はありません</h2>
            <p className="mt-1 text-sm font-medium leading-relaxed text-mute">最初の営業後トークを残すと、ここに表示されます。</p>
            <Link href="/post/backroom" className="mt-3 inline-flex h-10 items-center justify-center rounded-[8px] bg-ink px-4 text-xs font-black text-white">
              投稿する
            </Link>
          </div>
        ) : (
          posts.map((post) => <BackroomCard key={post.id} post={post} />)
        )}
      </section>
    </PageChrome>
  );
}
