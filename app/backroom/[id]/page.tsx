import { ArrowLeft, MessageCircle, Send, UserRound } from "lucide-react";
import Link from "next/link";
import { SignupRequiredCard } from "@/components/AuthGate";
import { BackroomSetupRequiredCard } from "@/components/BackroomSetupRequiredCard";
import { FormDisclaimer } from "@/components/FormDisclaimer";
import { LoadingSubmitButton } from "@/components/LoadingButton";
import { PageChrome } from "@/components/PageChrome";
import {
  backroomAuthorName,
  backroomCommentAuthorName,
  backroomDateLabel,
  getBackroomPostById,
  getBackroomProfile,
  listBackroomComments,
  normalizeBackroomCategory,
  type BackroomComment,
} from "@/lib/supabase/backroom";
import { createClient } from "@/lib/supabase/server";
import { createBackroomCommentAction } from "../actions";

type BackroomDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ posted?: string; comment?: string; commentError?: string }>;
};

function CommentItem({ comment }: { comment: BackroomComment }) {
  const name = backroomCommentAuthorName(comment);

  return (
    <article className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-ink text-[0.68rem] font-black text-white">
          {name.slice(0, 1)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-black text-ink">{name}</span>
          <span className="mt-0.5 block text-[0.66rem] font-bold text-mute">{backroomDateLabel({ created_at: comment.created_at })}</span>
        </span>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-ink">{comment.body}</p>
    </article>
  );
}

export default async function BackroomDetailPage({ params, searchParams }: BackroomDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-4">
          <Link href="/backroom" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
            <ArrowLeft aria-hidden="true" size={17} />
            Back Roomへ戻る
          </Link>
        </section>
        <SignupRequiredCard kind="backyard" />
      </PageChrome>
    );
  }

  const { profile: backroomProfile } = await getBackroomProfile(supabase, user.id);

  if (backroomProfile == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-4">
          <Link href="/backroom" className="inline-flex items-center gap-1.5 text-sm font-black text-ink transition active:scale-[0.98]">
            <ArrowLeft aria-hidden="true" size={17} />
            Back Roomへ戻る
          </Link>
        </section>
        <BackroomSetupRequiredCard next={`/backroom/${id}`} />
      </PageChrome>
    );
  }

  const { post, error: postError } = await getBackroomPostById(supabase, id);

  if (post == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-4">
          <Link href="/backroom" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
            <ArrowLeft aria-hidden="true" size={17} />
            Back Roomへ戻る
          </Link>
        </section>
        <section className="px-4 pt-8">
          <h1 className="text-2xl font-black text-ink">投稿が見つかりません</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
            指定されたBack Room投稿は削除されたか、まだ登録されていません。
          </p>
          {postError ? (
            <p className="mt-3 rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
              Supabase SQL Editorで最新migrationが適用済みか確認してください。
            </p>
          ) : null}
        </section>
      </PageChrome>
    );
  }

  const { comments, error: commentsError } = await listBackroomComments(supabase, post.id, 80);
  const authorName = backroomAuthorName(post);

  return (
    <PageChrome>
      <section className="px-4 pt-4">
        <Link href={`/backroom?category=${encodeURIComponent(normalizeBackroomCategory(post.category))}`} className="inline-flex items-center gap-1.5 text-sm font-black text-ink transition active:scale-[0.98]">
          <ArrowLeft aria-hidden="true" size={17} />
          カテゴリーへ戻る
        </Link>
      </section>

      <article className="px-4 pt-5">
        {query?.posted === "1" ? (
          <div className="mb-3 rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-sm font-black text-ink">投稿しました。</div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-blushSoft px-2.5 py-1 text-[0.68rem] font-black text-blush">{normalizeBackroomCategory(post.category)}</span>
          <span className="text-xs font-bold text-mute">{backroomDateLabel(post)}</span>
          <span className="text-xs font-bold text-mute">コメント {comments.length}</span>
        </div>
        <h1 className="mt-3 text-[1.45rem] font-black leading-tight text-ink">{post.title}</h1>
        <div className="mt-3 flex min-w-0 items-center gap-2">
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-ink text-sm font-black text-white">
            {authorName.slice(0, 1)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-ink">{authorName}</span>
            <span className="mt-0.5 block truncate text-xs font-semibold text-mute">Back Roomメンバー</span>
          </span>
        </div>
        <div className="mt-4 rounded-[10px] border border-line bg-white p-4 shadow-sm">
          <p className="whitespace-pre-wrap text-[0.94rem] font-medium leading-relaxed text-ink">{post.body}</p>
        </div>
      </article>

      <section className="px-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-base font-black text-ink">
            <MessageCircle aria-hidden="true" size={18} className="text-blush" />
            コメント {comments.length}
          </h2>
        </div>
        {query?.comment === "posted" ? (
          <div className="mt-3 rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-sm font-black text-ink">コメントしました。</div>
        ) : null}
        {commentsError ? (
          <div className="mt-3 rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
            コメントを読み込めませんでした。最新migrationを確認してください。
          </div>
        ) : null}
        <div className="mt-3 grid gap-2.5">
          {comments.length === 0 ? (
            <div className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-blushSoft text-blush">
                <UserRound aria-hidden="true" size={17} />
              </div>
              <p className="mt-2 text-sm font-black text-ink">まだコメントはありません</p>
              <p className="mt-1 text-xs font-medium leading-relaxed text-mute">最初の返信を残すと、ここに表示されます。</p>
            </div>
          ) : (
            comments.map((comment) => <CommentItem key={comment.id} comment={comment} />)
          )}
        </div>
      </section>

      <section className="px-4 pt-5">
        <form action={createBackroomCommentAction} className="rounded-[10px] border border-line bg-white p-3 shadow-sm">
          <input type="hidden" name="postId" value={post.id} />
          {query?.commentError ? (
            <div className="mb-3 rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
              {query.commentError}
            </div>
          ) : null}
          <label className="grid gap-2">
            <span className="text-sm font-black text-ink">コメントする</span>
            <textarea
              name="body"
              rows={4}
              maxLength={1000}
              required
              className="resize-none rounded-[8px] border border-line bg-neutral-50 px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush focus:bg-white"
              placeholder="相談、経験共有、雑談を気軽に残してください。"
            />
          </label>
          <LoadingSubmitButton pendingText="コメント中..." className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-blush text-sm font-black text-white">
            <Send aria-hidden="true" size={16} />
            コメント投稿
          </LoadingSubmitButton>
          <FormDisclaimer className="mt-2">
            相手への敬意を持ってコメントしてください。個人攻撃、実名批判、顧客情報、他店への誹謗中傷は投稿できません。
          </FormDisclaimer>
        </form>
      </section>
    </PageChrome>
  );
}
