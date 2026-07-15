import { Bookmark, MessageCircle, Send, Sparkles, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { createArticleCommentAction, toggleArticleReactionAction } from "@/app/articles/actions";
import { FormDisclaimer } from "@/components/FormDisclaimer";
import { LoadingSubmitButton } from "@/components/LoadingButton";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ThanksActionButton } from "@/components/ThanksActionButton";
import { pathWithParams } from "@/lib/auth/redirects";
import type { ArticleComment, ArticleMetrics } from "@/lib/supabase/articles";

type ArticleEngagementPanelProps = {
  articleId: string;
  authorId?: string | null;
  currentUserId?: string | null;
  metrics: ArticleMetrics;
  comments: ArticleComment[];
  reactionError?: string;
  commentError?: string;
  commentPosted?: boolean;
};

const reactionButtonBase =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-full border px-3 text-[0.72rem] font-black transition active:scale-[0.98] disabled:active:scale-100 disabled:cursor-not-allowed";

const reactionConfig = {
  thanks: {
    label: "Thanks",
    icon: Sparkles,
    pressedKey: "viewer_has_thanked",
  },
  like: {
    label: "いいね",
    icon: ThumbsUp,
    pressedKey: "viewer_has_liked",
  },
  save: {
    label: "保存",
    icon: Bookmark,
    pressedKey: "viewer_has_saved",
  },
} as const;

const reactionOrder: Array<keyof typeof reactionConfig> = ["thanks", "like", "save"];

function commentDateLabel(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function commenterName(comment: ArticleComment) {
  return comment.profiles?.display_name?.trim() || "プロフィール未設定";
}

function LoginReactionLink({ articleId, label, children }: { articleId: string; label: string; children: ReactNode }) {
  return (
    <Link
      href={pathWithParams("/login", { next: `/articles/${articleId}`, message: `${label}にはログインしてください。` })}
      className={reactionButtonBase + " border-line/80 bg-white text-ink/78 active:opacity-70"}
    >
      {children}
      <span>{label}</span>
    </Link>
  );
}

function CommentActionButton({ commentCount }: { commentCount: number }) {
  return (
    <a href="#article-comments" className={reactionButtonBase + " border-line/80 bg-white text-ink/78 transition hover:border-blush/25 hover:bg-blushSoft/50 active:opacity-70"}>
      <MessageCircle aria-hidden="true" size={15} strokeWidth={1.9} />
      <span>コメント {commentCount}</span>
    </a>
  );
}

export function ArticleEngagementPanel({
  articleId,
  authorId,
  currentUserId,
  metrics,
  comments,
  reactionError,
  commentError,
  commentPosted,
}: ArticleEngagementPanelProps) {
  const isOwnArticle = currentUserId != null && authorId != null && currentUserId === authorId;

  return (
    <section className="mt-5 rounded-[8px] border border-line/80 bg-white p-3.5 shadow-[0_8px_20px_rgba(17,17,17,0.035)]">
      <div className="flex flex-wrap items-center gap-1.5">
        {reactionOrder.map((reactionType) => {
          const config = reactionConfig[reactionType];
          const Icon = config.icon;
          const pressed = metrics[config.pressedKey];
          const pressedClass = pressed ? " border-blush/25 bg-blushSoft text-ink" : " border-line/80 bg-white text-ink/78 hover:border-blush/25 hover:bg-blushSoft/50";
          const blocksOwnCountedReaction = isOwnArticle && reactionType !== "save";

          const button = (() => {
            if (currentUserId == null) {
              return (
                <LoginReactionLink articleId={articleId} label={config.label}>
                  <Icon aria-hidden="true" size={15} strokeWidth={1.9} className={reactionType === "thanks" ? "text-blush" : ""} />
                </LoginReactionLink>
              );
            }

            if (blocksOwnCountedReaction) {
              return (
                <button
                  type="button"
                  disabled
                  aria-pressed={false}
                  className={reactionButtonBase + " cursor-not-allowed border-line/80 bg-neutral-50 text-mute"}
                >
                  <Icon aria-hidden="true" size={15} strokeWidth={1.9} className={reactionType === "thanks" ? "text-blush/70" : ""} />
                  <span>{config.label}</span>
                </button>
              );
            }

            return (
              <form action={toggleArticleReactionAction}>
                <input type="hidden" name="articleId" value={articleId} />
                <input type="hidden" name="reactionType" value={reactionType} />
                {reactionType === "thanks" ? (
                  <ThanksActionButton type="submit" active={pressed} pendingText="保存中..." className={reactionButtonBase + pressedClass}>
                    <Icon aria-hidden="true" size={15} strokeWidth={1.9} className="text-blush" />
                    <span>{config.label}</span>
                  </ThanksActionButton>
                ) : (
                  <LoadingSubmitButton pendingText="保存中..." className={reactionButtonBase + pressedClass} ariaPressed={pressed}>
                    <Icon aria-hidden="true" size={15} strokeWidth={1.9} fill={pressed ? "currentColor" : "none"} />
                    <span>{config.label}</span>
                  </LoadingSubmitButton>
                )}
              </form>
            );
          })();

          return (
            <Fragment key={reactionType}>
              {button}
              {reactionType === "like" ? <CommentActionButton commentCount={metrics.comment_count} /> : null}
            </Fragment>
          );
        })}
      </div>

      {isOwnArticle ? (
        <p className="mt-2 text-[0.68rem] font-semibold text-mute">自分の記事へのThanks・いいねはカウントされません。</p>
      ) : null}
      {reactionError ? <p className="mt-2 text-[0.72rem] font-black leading-relaxed text-red-600">{reactionError}</p> : null}

      <div id="article-comments" className="mt-5 scroll-mt-4 border-t border-line/70 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-1.5 text-base font-black text-ink">
            <MessageCircle aria-hidden="true" size={17} />
            コメント {metrics.comment_count}
          </h2>
        </div>

        {commentPosted ? (
          <p className="mt-3 rounded-[8px] border border-blush/20 bg-blushSoft px-3 py-2 text-[0.72rem] font-black text-ink">
            コメントを投稿しました。
          </p>
        ) : null}
        {commentError ? (
          <p className="mt-3 rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-[0.72rem] font-black leading-relaxed text-red-700">
            {commentError}
          </p>
        ) : null}

        {currentUserId == null ? (
          <Link
            href={pathWithParams("/login", { next: `/articles/${articleId}`, message: "コメントにはログインしてください。" })}
            className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink text-sm font-black text-white transition active:scale-[0.98] active:opacity-70"
          >
            ログインしてコメントする
          </Link>
        ) : (
          <form action={createArticleCommentAction} className="mt-3 grid gap-2">
            <input type="hidden" name="articleId" value={articleId} />
            <textarea
              name="body"
              rows={3}
              maxLength={1000}
              required
              placeholder="経験や気づきをコメントする"
              className="resize-none rounded-[8px] border border-line bg-neutral-50 px-3 py-2.5 text-sm font-medium leading-relaxed text-ink outline-none placeholder:text-mute/70 focus:border-ink/30 focus:bg-white"
            />
            <FormDisclaimer>
              相手への敬意を持ってコメントしてください。個人攻撃、実名批判、顧客情報、他店への誹謗中傷は投稿できません。
            </FormDisclaimer>
            <LoadingSubmitButton pendingText="コメント中..." className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[8px] bg-ink px-4 text-sm font-black text-white">
              <Send aria-hidden="true" size={15} />
              コメントする
            </LoadingSubmitButton>
          </form>
        )}

        <div className="mt-4 grid gap-2.5">
          {comments.length === 0 ? (
            <p className="rounded-[8px] border border-line bg-neutral-50 p-3 text-sm font-medium text-mute">まだコメントはありません。</p>
          ) : (
            comments.map((comment) => (
              <article key={comment.id} className="flex gap-2.5 rounded-[8px] bg-neutral-50 p-3">
                <Link href={`/profiles/${comment.user_id}`} className="shrink-0 rounded-full">
                  <ProfileAvatar src={comment.profiles?.avatar_url} name={commenterName(comment)} size="compact" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Link href={`/profiles/${comment.user_id}`} className="truncate text-xs font-black text-ink">
                      {commenterName(comment)}
                    </Link>
                    <span className="text-[0.64rem] font-bold text-mute">{commentDateLabel(comment.created_at)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-ink">{comment.body}</p>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
