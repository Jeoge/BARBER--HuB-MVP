"use client";

import { MessageCircle, Send, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useState, useTransition } from "react";
import { addSnapCommentAction, deleteSnapCommentAction } from "@/lib/actions/comments";
import { pathWithParams } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/client";
import { commentTimeLabel, countSnapComments, listSnapComments, type SnapComment } from "@/lib/supabase/comments";

const pill =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-line/80 bg-white px-3 text-[0.7rem] font-black text-ink/78 transition hover:border-blush/25 hover:bg-blushSoft/50 active:scale-[0.98]";

function initial(name: string | null) {
  return (name?.trim().slice(0, 1) || "?").toUpperCase();
}

export function SnapCommentButton({ snapId, currentUserId }: { snapId: string; currentUserId?: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [comments, setComments] = useState<SnapComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // カードにコメント数を表示するため、マウント時に件数だけ取得。
  useEffect(() => {
    let active = true;
    const supabase = createClient();
    (async () => {
      const c = await countSnapComments(supabase, snapId);
      if (active) setCount(c);
    })();
    return () => {
      active = false;
    };
  }, [snapId]);

  const loadComments = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const list = await listSnapComments(supabase, snapId);
    setComments(list);
    setCount(list.length);
    setLoading(false);
  }, [snapId]);

  function openSheet() {
    setOpen(true);
    setError(null);
    void loadComments();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = text.trim();
    if (body.length === 0 || isPending) return;
    setError(null);

    startTransition(async () => {
      const result = await addSnapCommentAction(snapId, body);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setText("");
      await loadComments();
      router.refresh();
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

  return (
    <>
      <button type="button" onClick={openSheet} aria-label="コメントを見る" className={pill}>
        <MessageCircle aria-hidden="true" size={15} strokeWidth={1.9} />
        コメント
        {count != null && count > 0 ? <span className="tabular-nums">{count}</span> : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true">
          <button type="button" aria-label="閉じる" onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/40" />

          <div className="relative flex max-h-[85vh] flex-col rounded-t-[18px] bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.18)]">
            <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line" />
            <div className="flex items-center justify-between px-5 pb-3 pt-3">
              <h2 className="text-lg font-black text-ink">コメント</h2>
              <button
                type="button"
                aria-label="閉じる"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-mute"
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
                  <div key={comment.id} className="rounded-[10px] bg-neutral-50 p-3">
                    <div className="flex items-start gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-ink text-[0.68rem] font-black text-white">
                        {comment.author?.avatar_url ? (
                          <img src={comment.author.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          initial(comment.author?.display_name ?? null)
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-black text-ink">
                            {comment.author?.display_name?.trim() || "プロフィール未設定"}
                          </span>
                          <span className="shrink-0 text-[0.66rem] font-semibold text-mute">{commentTimeLabel(comment.created_at)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-ink">{comment.body}</p>
                        {currentUserId != null && currentUserId === comment.user_id ? (
                          <button
                            type="button"
                            onClick={() => removeComment(comment.id)}
                            disabled={isPending}
                            className="mt-1.5 inline-flex items-center gap-1 text-[0.66rem] font-bold text-mute transition hover:text-red-600 active:scale-[0.98] disabled:opacity-50"
                          >
                            <Trash2 aria-hidden="true" size={12} />
                            削除
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 入力欄 */}
            {error ? <p className="px-5 pb-1 text-xs font-bold text-red-600">{error}</p> : null}
            {currentUserId == null ? (
              <div className="border-t border-line px-4 py-3 pb-6">
                <Link
                  href={pathWithParams("/login", { next: `/posts/${snapId}`, message: "コメントするにはログインしてください。" })}
                  className="flex h-11 items-center justify-center rounded-full bg-ink text-sm font-black text-white"
                >
                  ログインしてコメントする
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="flex items-end gap-2 border-t border-line px-4 py-3 pb-6">
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  rows={1}
                  placeholder="コメントを書く..."
                  className="max-h-28 flex-1 resize-none rounded-[18px] border border-line bg-neutral-50 px-4 py-2.5 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush"
                />
                <button
                  type="submit"
                  disabled={isPending || text.trim().length === 0}
                  aria-label="送信"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-white transition active:scale-95 disabled:opacity-40"
                >
                  <Send aria-hidden="true" size={18} />
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
