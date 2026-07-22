import { LockKeyhole, MessageCircle, Plus, UserRound } from "lucide-react";
import { SignupRequiredCard } from "@/components/AuthGate";
import { BackroomSetupRequiredCard } from "@/components/BackroomSetupRequiredCard";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { PendingLink } from "@/components/PendingLink";
import { backRoomTheme } from "@/lib/backRoomTheme";
import {
  BACKROOM_CATEGORIES,
  backroomAuthorMeta,
  backroomAuthorName,
  backroomDateLabel,
  backroomExcerpt,
  getBackroomProfile,
  listBackroomPosts,
  normalizeBackroomCategory,
  type BackroomPostWithAuthor,
} from "@/lib/supabase/backroom";
import { createClient } from "@/lib/supabase/server";

type BackroomPageProps = {
  searchParams?: Promise<{ posted?: string; joined?: string; category?: string; deleted?: string; deleteError?: string }>;
};

function AuthorLine({ post }: { post: BackroomPostWithAuthor }) {
  const name = backroomAuthorName(post);
  const meta = backroomAuthorMeta(post);

  return (
    <div className="mt-3 flex min-w-0 items-center gap-2">
      <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-ink text-[0.68rem] font-black text-white">
        {name.slice(0, 1)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-black text-ink">{name}</span>
        {meta ? <span className="mt-0.5 block truncate text-[0.64rem] font-semibold text-mute">{meta}</span> : null}
      </span>
    </div>
  );
}

function BackroomCard({ post }: { post: BackroomPostWithAuthor }) {
  return (
    <article className={"rounded-[10px] border bg-white p-4 " + backRoomTheme.threadCard}>
      <PendingLink href={`/backroom/${post.id}`} pendingLabel="開いています..." className="block">
        <div className="flex items-start justify-between gap-3">
          <span className={"rounded-full px-2.5 py-1 text-[0.66rem] font-black " + backRoomTheme.tag}>{normalizeBackroomCategory(post.category)}</span>
          <span className="shrink-0 text-[0.66rem] font-bold text-mute">{backroomDateLabel(post)}</span>
        </div>
        <h2 className="mt-3 line-clamp-2 text-[1rem] font-black leading-snug text-ink">{post.title}</h2>
        <p className="mt-2 line-clamp-3 text-sm font-medium leading-relaxed text-mute">{backroomExcerpt(post.body, 110)}</p>
      </PendingLink>
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
  const selectedCategory = params?.category && BACKROOM_CATEGORIES.includes(params.category as (typeof BACKROOM_CATEGORIES)[number])
    ? (params.category as (typeof BACKROOM_CATEGORIES)[number])
    : null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
    return (
      <PageChrome variant="backroom">
        <PageHeaderBlock
          eyebrow="BACK ROOM"
          title="Back Room"
          body="理美容業界の営業後コミュニティ。"
          variant="backroom"
        />
        <SignupRequiredCard kind="backyard" />
      </PageChrome>
    );
  }

  const { profile: backroomProfile } = await getBackroomProfile(supabase, user.id);

  if (backroomProfile == null) {
    return (
      <PageChrome variant="backroom">
        <PageHeaderBlock
          eyebrow="BACK ROOM"
          title="Back Room"
          body="理美容業界の営業後コミュニティ。参加には通常ログインに加えて、Back Room専用ニックネームが必要です。"
          variant="backroom"
        />
        <BackroomSetupRequiredCard next="/backroom" />
      </PageChrome>
    );
  }

  const { posts, error } = await listBackroomPosts(supabase, 40, selectedCategory);

  return (
    <PageChrome variant="backroom">
      <section className="px-4 pt-5">
        <div className={"rounded-[10px] p-4 text-white " + backRoomTheme.hero}>
          <div className={"inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.64rem] font-black " + backRoomTheme.badge}>
            <span className={"grid h-6 w-6 place-items-center rounded-full " + backRoomTheme.badgeIcon}>
              <LockKeyhole aria-hidden="true" size={15} strokeWidth={2.6} />
            </span>
            会員限定
          </div>
          <h1 className="editorial-serif mt-3 text-[1.8rem] leading-tight">Back Room</h1>
          <p className="mt-2 text-[0.88rem] font-semibold leading-relaxed text-white/88">理美容業界の営業後コミュニティ</p>
          <PendingLink href="/post/backroom" pendingLabel="投稿画面へ..." className={"mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] text-sm font-black " + backRoomTheme.primaryButton}>
            <Plus aria-hidden="true" size={17} />
            スレッドを立てる
          </PendingLink>
        </div>
      </section>

      <section className="px-4 pt-4">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          <PendingLink
            href="/backroom"
            className={
              "shrink-0 rounded-full px-3 py-1.5 text-[0.66rem] font-black " +
              (selectedCategory == null ? backRoomTheme.activeChip : backRoomTheme.inactiveChip)
            }
          >
            すべて
          </PendingLink>
          {BACKROOM_CATEGORIES.map((category) => (
            <PendingLink
              key={category}
              href={`/backroom?category=${encodeURIComponent(category)}`}
              className={
                "shrink-0 rounded-full px-3 py-1.5 text-[0.66rem] font-black " +
                (selectedCategory === category ? backRoomTheme.activeChip : backRoomTheme.inactiveChip)
              }
            >
              {category}
            </PendingLink>
          ))}
        </div>
      </section>

      <section className="grid gap-3 px-4 pt-4">
        {params?.posted === "1" ? (
          <div className={"rounded-[8px] p-3 text-sm font-black text-ink " + backRoomTheme.notice}>スレッドを作成しました。</div>
        ) : null}
        {params?.joined === "1" ? (
          <div className={"rounded-[8px] p-3 text-sm font-black text-ink " + backRoomTheme.notice}>Back Room参加設定を保存しました。</div>
        ) : null}
        {params?.deleted === "1" ? (
          <div className={"rounded-[8px] p-3 text-sm font-black text-ink " + backRoomTheme.notice} role="status">
            スレッドを削除しました。
          </div>
        ) : null}
        {params?.deleteError === "1" ? (
          <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700" role="alert">
            スレッドを削除できませんでした。時間をおいて再度お試しください。
          </div>
        ) : null}
        {error ? (
          <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
            Back Roomを読み込めませんでした。時間をおいて再読み込みしてください。
          </div>
        ) : null}
        {posts.length === 0 ? (
          <div className={"rounded-[10px] border bg-white p-4 " + backRoomTheme.threadCard}>
            <div className={"grid h-10 w-10 place-items-center rounded-full " + backRoomTheme.iconSurface}>
              <UserRound aria-hidden="true" size={19} />
            </div>
            <h2 className="mt-3 text-base font-black text-ink">まだスレッドはありません</h2>
            <p className="mt-1 text-sm font-medium leading-relaxed text-mute">このカテゴリーに最初のスレッドを立てると、ここに表示されます。</p>
            <PendingLink href="/post/backroom" pendingLabel="投稿画面へ..." className={"mt-3 inline-flex h-10 items-center justify-center rounded-[8px] px-4 text-xs font-black " + backRoomTheme.primaryButton}>
              スレッドを立てる
            </PendingLink>
          </div>
        ) : (
          posts.map((post) => <BackroomCard key={post.id} post={post} />)
        )}
      </section>
    </PageChrome>
  );
}
