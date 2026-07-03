"use client";

import { Flag, LockKeyhole, MessageCircle, RefreshCw, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  BACK_ROOM_COMMENTS_STEP,
  BACK_ROOM_COMMENT_LIMIT,
  BACK_ROOM_INITIAL_COMMENTS,
  commentsForThread,
  moderationLabel,
  type BackRoomComment,
} from "@/lib/backRoom";
import type { BackyardPost } from "@/lib/mockData";

function ReportButton({ label = "不適切" }: { label?: string }) {
  return (
    <button type="button" className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-mute hover:text-ink">
      <Flag aria-hidden="true" size={13} />
      {label}
    </button>
  );
}

function CommentBody({ comment }: { comment: BackRoomComment }) {
  if (comment.moderationStatus === "hidden") {
    return <p className="text-xs font-bold text-mute">このコメントは運営確認により一時非表示です。</p>;
  }

  if (comment.moderationStatus === "collapsed") {
    return <p className="text-xs font-bold text-mute">このコメントは不適切報告が複数届いているため、折りたたまれています。</p>;
  }

  return <p className="mt-1 text-sm font-medium leading-relaxed text-ink">{comment.body}</p>;
}

function CommentItem({ comment }: { comment: BackRoomComment }) {
  const label = moderationLabel(comment.moderationStatus);

  return (
    <article className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-black text-ink">{comment.nickname}</p>
            {label ? <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[0.58rem] font-black text-mute">{label}</span> : null}
          </div>
          <p className="mt-0.5 text-[0.68rem] font-bold text-mute">{comment.createdAt}</p>
        </div>
        <ReportButton />
      </div>
      <CommentBody comment={comment} />
      {comment.moderationStatus === "review" ? <p className="mt-2 text-[0.68rem] font-bold text-mute">運営確認中です。判断後に表示状態を更新します。</p> : null}
    </article>
  );
}

export function BackRoomThreadDetail({ thread }: { thread: BackyardPost }) {
  const comments = commentsForThread(thread.id);
  const [visibleCount, setVisibleCount] = useState(BACK_ROOM_INITIAL_COMMENTS);
  const visibleComments = comments.slice(0, visibleCount);
  const moderationStatus = thread.moderationStatus ?? "normal";
  const label = moderationLabel(moderationStatus);
  const reachedLimit = thread.comments >= BACK_ROOM_COMMENT_LIMIT;
  const isLocked = moderationStatus === "locked" || reachedLimit;
  const isHidden = moderationStatus === "hidden";
  const canShowMore = visibleCount < comments.length && visibleCount < BACK_ROOM_COMMENT_LIMIT;

  return (
    <>
      <article className="px-4 pt-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-blushSoft px-2.5 py-1 text-[0.68rem] font-black text-blush">{thread.category}</span>
          {label ? <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[0.64rem] font-black text-mute">{label}</span> : null}
        </div>
        <h1 className="mt-3 text-[1.45rem] font-black leading-tight text-ink">{thread.title ?? thread.body}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-mute">
          <span>{thread.anonymousName}</span>
          <span>{thread.createdAt ?? "今日"}</span>
          <span>{thread.comments}コメント</span>
        </div>

        <div className="mt-4 rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-[0.78rem] font-black leading-relaxed text-ink">
          Back Room投稿です。表プロフィールとは別のニックネームで、落ち着いて会話します。
        </div>

        <div className="mt-4 rounded-[8px] border border-line bg-white p-4 shadow-sm">
          {isHidden ? (
            <p className="text-sm font-bold leading-relaxed text-mute">このスレッドは運営確認により一時非表示です。</p>
          ) : (
            <p className="text-[0.94rem] font-medium leading-relaxed text-ink">{thread.body}</p>
          )}
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[0.68rem] font-bold text-mute">報告は即BANではなく、運営確認後に判断します。</p>
            <ReportButton label="報告" />
          </div>
        </div>
      </article>

      <section className="px-4 pt-5">
        <div className="rounded-[8px] border border-line bg-white p-3">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <MessageCircle aria-hidden="true" size={17} className="text-blush" />
            コメント
          </div>
          <p className="mt-1 text-xs font-medium leading-relaxed text-mute">
            初期表示は{BACK_ROOM_INITIAL_COMMENTS}件。もっと見るで{BACK_ROOM_COMMENTS_STEP}件ずつ表示します。
            将来的にはcursor paginationへ移行できる前提です。
          </p>
        </div>

        <div className="mt-3 grid gap-2.5">
          {visibleComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>

        {canShowMore ? (
          <button
            type="button"
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-line bg-white text-sm font-black text-ink"
            onClick={() => setVisibleCount((current) => Math.min(current + BACK_ROOM_COMMENTS_STEP, comments.length, BACK_ROOM_COMMENT_LIMIT))}
          >
            <RefreshCw aria-hidden="true" size={16} />
            もっと見る
          </button>
        ) : null}
      </section>

      <section className="px-4 pt-5">
        {reachedLimit ? (
          <div className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
            <p className="text-sm font-black text-ink">このスレッドはコメント上限に達しました。</p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-mute">続きの話題は新しいスレッドを立ててください。</p>
            <Link href="/post/backyard" className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink text-sm font-black text-white">
              続きスレッドを立てる
            </Link>
          </div>
        ) : isLocked ? (
          <div className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-black text-ink">
              <LockKeyhole aria-hidden="true" size={17} className="text-blush" />
              このスレッドはロック中です
            </div>
            <p className="mt-1 text-xs font-medium leading-relaxed text-mute">運営確認中のため、コメント投稿を一時停止しています。</p>
          </div>
        ) : (
          <div className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
            <label className="grid gap-2">
              <span className="text-sm font-black text-ink">コメントする</span>
              <textarea
                rows={4}
                className="resize-none rounded-[8px] border border-line bg-neutral-50 px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush focus:bg-white"
                placeholder="相談、経験共有、雑談は歓迎です。個人名・店舗名を出した攻撃や晒しは禁止です。"
              />
            </label>
            <button type="button" className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-blush text-sm font-black text-white">
              <Send aria-hidden="true" size={16} />
              コメント投稿
            </button>
          </div>
        )}
      </section>
    </>
  );
}
