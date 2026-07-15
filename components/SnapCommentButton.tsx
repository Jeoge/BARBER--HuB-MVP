"use client";

import { MessageCircle, Send, ThumbsUp, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { FormDisclaimer } from "@/components/FormDisclaimer";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useCommentSheetFabHidden } from "@/components/useCommentSheetFabHidden";
import { addSnapCommentAction, deleteSnapCommentAction, toggleSnapCommentLikeAction } from "@/lib/actions/comments";
import { pathWithParams } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/client";
import { commentTimeLabel, listSnapComments, type SnapComment } from "@/lib/supabase/comments";

const pill =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-line/80 bg-white px-3 text-[0.7rem] font-black text-ink/78 transition hover:border-blush/25 hover:bg-blushSoft/50 active:scale-[0.98]";

export function SnapCommentButton({
  snapId,
  currentUserId,
  showCount = false,
  initialCount = 0,
}: {
  snapId: string;
  currentUserId?: string | null;
  showCount?: boolean;
  initialCount?: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [comments, setComments] = useState<SnapComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [likeSubmittingId, setLikeSubmittingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const submittingRef = useRef(false);
  useCommentSheetFabHidden(open);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`;
  }, [text, open]);

  const loadComments = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const list = await listSnapComments(supabase, snapId, currentUserId);
    setComments(list);
    setCount(list.length);
    setLoading(false);
  }, [currentUserId, snapId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.location.hash.startsWith("#snap-comment-")) return;

    setOpen(true);
    setError(null);
    void loadComments();
  }, [loadComments]);

  useEffect(() => {
    if (!open || comments.length === 0 || typeof window === "undefined") return;
    const targetId = window.location.hash.replace(/^#/, "");
    if (!targetId.startsWith("snap-comment-")) return;

    window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ block: "center" });
    });
  }, [comments, open]);

  function openSheet() {
    setOpen(true);
    setError(null);
    void loadComments();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = text.trim();
    if (body.length === 0 || submittingRef.current) return;
    setError(null);
    submittingRef.current = true;
    setSubmitting(true);

    startTransition(async () => {
      try {
        const result = await addSnapCommentAction(snapId, body);
        if (result.status === "error") {
          setError(result.message);
          return;
        }
        setText("");
        await loadComments();
        router.refresh();
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    });
  }

  function removeComment(commentId: string) {
    startTransition(async () => {
      const result = await deleteSnapCommentAction(commentId);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      await loadComments();
      router.refresh();
    });
  }

  function toggleCommentLike(comment: SnapComment) {
    if (currentUserId == null || currentUserId === comment.user_id || likeSubmittingId != null) return;

    setError(null);
    setLikeSubmittingId(comment.id);

    startTransition(async () => {
      try {
        const result = await toggleSnapCommentLikeAction(comment.id, snapId);
        if (result.status === "error") {
          setError(result.message);
          if (typeof result.count === "number" || typeof result.active === "boolean") {
            setComments((current) =>
              current.map((item) =>
                item.id === comment.id
                  ? {
                      ...item,
                      like_count: typeof result.count === "number" ? result.count : item.like_count,
                      viewer_has_liked: typeof result.active === "boolean" ? result.active : item.viewer_has_liked,
                    }
                  : item
              )
            );
          }
          return;
        }

        setComments((current) =>
          current.map((item) =>
            item.id === comment.id
              ? {
                  ...item,
                  like_count: result.count,
                  viewer_has_liked: result.active,
                }
              : item
          )
        );
        router.refresh();
      } finally {
        setLikeSubmittingId(null);
      }
    });
  }

  function commentLikeControl(comment: SnapComment) {
    const isOwnComment = currentUserId != null && currentUserId === comment.user_id;
    const active = comment.viewer_has_liked;
    const pending = likeSubmittingId === comment.id;
    const className =
      "inline-flex h-7 items-center justify-center gap-1 rounded-full border px-2 text-[0.66rem] font-black transition active:scale-[0.98] disabled:active:scale-100 disabled:cursor-not-allowed " +
      (active
        ? "border-blush/25 bg-blushSoft text-ink"
        : "border-line/80 bg-white text-mute hover:border-blush/25 hover:bg-blushSoft/45") +
      (pending ? " cursor-wait opacity-70" : "");

    if (currentUserId == null) {
      return (
        <Link
          href={pathWithParams("/login", {
            next: `/posts/${snapId}#snap-comment-${comment.id}`,
            message: "コメントにいいねするにはログインしてください。",
          })}
          className={className}
          aria-label="コメントにいいねするにはログインしてください"
        >
          <ThumbsUp aria-hidden="true" size={12} strokeWidth={1.9} />
          <span>{comment.like_count}</span>
        </Link>
      );
    }

    if (isOwnComment) {
      return (
        <button
          type="button"
          disabled
          aria-pressed={false}
          aria-label="自分のコメントにはいいねできません"
          className="inline-flex h-7 items-center justify-center gap-1 rounded-full border border-line/80 bg-neutral-100 px-2 text-[0.66rem] font-black text-mute"
        >
          <ThumbsUp aria-hidden="true" size={12} strokeWidth={1.9} />
          <span>{comment.like_count}</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => toggleCommentLike(comment)}
        disabled={pending || likeSubmittingId != null}
        aria-pressed={active}
        aria-busy={pending}
        aria-label={active ? "コメントのいいねを取り消す" : "コメントにいいねする"}
        className={className}
      >
        <ThumbsUp aria-hidden="true" size={12} strokeWidth={1.9} fill={active ? "currentColor" : "none"} />
        <span>{comment.like_count}</span>
      </button>
    );
  }

  return (
    <>
      <button type="button" onClick={openSheet} aria-label="コメントを見る" className={pill}>
        <MessageCircle aria-hidden="true" size={15} strokeWidth={1.9} />
        {showCount ? `コメント ${count}` : "コメント"}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true">
          <button type="button" aria-label="閉じる" onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/40 active:opacity-70" />

          <div className="relative flex max-h-[85vh] flex-col rounded-t-[18px] bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.18)]">
            <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line" />
            <div className="flex items-center justify-between px-5 pb-3 pt-3">
              <h2 className="text-lg font-black text-ink">コメント</h2>
              <button
                type="button"
                aria-label="閉じる"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-mute transition active:scale-[0.98] active:opacity-70"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>

            {/* コメント一覧 */}
            <div className="min-h-[6rem] flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-4 pb-3">
              {loading ? (
                <p className="px-1 py-6 text-center text-sm font-semibold text-mute">読み込み中...</p>
              ) : comments.length === 0 ? (
                <p className="px-1 py-8 text-center text-sm font-semibold text-mute">まだコメントはありません。最初のコメントを書いてみましょう。</p>
              ) : (
                comments.map((comment) => (
                  <div id={`snap-comment-${comment.id}`} key={comment.id} className="scroll-mt-4 rounded-[10px] bg-neutral-50 p-3">
                    <div className="flex items-start gap-2.5">
                      <ProfileAvatar
                        src={comment.author?.avatar_url}
                        name={comment.author?.display_name?.trim() || "プロフィール未設定"}
                        size="compact"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-black text-ink">
                            {comment.author?.display_name?.trim() || "プロフィール未設定"}
                          </span>
                          <span className="shrink-0 text-[0.66rem] font-semibold text-mute">{commentTimeLabel(comment.created_at)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-ink">{comment.body}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {commentLikeControl(comment)}
                          {currentUserId != null && currentUserId === comment.user_id ? (
                            <button
                              type="button"
                              onClick={() => removeComment(comment.id)}
                              disabled={isPending}
                              aria-busy={isPending}
                              className="inline-flex h-7 items-center gap-1 text-[0.66rem] font-bold text-mute transition hover:text-red-600 active:scale-[0.98] disabled:active:scale-100 disabled:opacity-50"
                            >
                              <Trash2 aria-hidden="true" size={12} />
                              削除
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 入力欄 */}
            {error ? <p className="px-5 pb-1 text-xs font-bold text-red-600">{error}</p> : null}
            {currentUserId == null ? (
              <div className="border-t border-line px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                <Link
                  href={pathWithParams("/login", { next: `/posts/${snapId}`, message: "コメントするにはログインしてください。" })}
                  className="flex h-11 items-center justify-center rounded-full bg-ink text-sm font-black text-white transition active:scale-[0.98] active:opacity-70"
                >
                  ログインしてコメントする
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="border-t border-line px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    rows={1}
                    placeholder="コメントを書く..."
                    className="max-h-28 min-h-11 flex-1 resize-none overflow-y-auto rounded-[18px] border border-line bg-neutral-50 px-4 py-2.5 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush"
                  />
                  <button
                    type="submit"
                    disabled={isPending || submitting || text.trim().length === 0}
                    aria-label="送信"
                    aria-busy={isPending || submitting}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-white transition active:scale-[0.98] active:opacity-70 disabled:active:scale-100 disabled:active:opacity-40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send aria-hidden="true" size={18} />
                  </button>
                </div>
                <FormDisclaimer className="mt-2">
                  相手への敬意を持ってコメントしてください。個人攻撃、実名批判、顧客情報、他店への誹謗中傷は投稿できません。
                </FormDisclaimer>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
