"use client";

import { Send, ThumbsUp, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ProfileMiniLink } from "./ProfileMiniLink";

export type SheetComment = {
  id: string;
  author: string;
  profileId?: string;
  date: string;
  body: string;
};

type CommentSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  comments?: SheetComment[];
};

const defaultComments: SheetComment[] = [
  {
    id: "editor-note",
    author: "BARBER HUB編集部",
    profileId: "barber-hub-editor",
    date: "今日",
    body: "現場で試しやすい形に整理しました。あとから見返せるように保存しておくのもおすすめです。",
  },
  {
    id: "barber-voice",
    author: "個人理容師",
    profileId: "fukuoka-barber",
    date: "2時間前",
    body: "自分の店でも応用できそうです。こういう実例があると助かります。",
  },
  {
    id: "owner-note",
    author: "個人店オーナー",
    profileId: "barber-sample-fukuoka-nishi",
    date: "昨日",
    body: "明日の朝礼で共有してみます。",
  },
];

function CommentItem({ comment }: { comment: SheetComment }) {
  const [liked, setLiked] = useState(false);

  return (
    <article className="flex gap-2.5 rounded-[8px] bg-neutral-50 p-3">
      <ProfileMiniLink profileId={comment.profileId} fallbackName={comment.author} compact className="self-start pr-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[0.64rem] font-bold text-mute">{comment.date}</p>
        <p className="mt-1 text-sm font-medium leading-relaxed text-ink">{comment.body}</p>
        <div className="mt-2 flex items-center gap-3 text-[0.68rem] font-bold text-mute">
          <button
            type="button"
            aria-pressed={liked}
            className={"inline-flex items-center gap-1 rounded-full px-2 py-1 transition " + (liked ? "bg-white text-ink" : "hover:bg-white")}
            onClick={() => setLiked((current) => !current)}
          >
            <ThumbsUp aria-hidden="true" size={12} strokeWidth={1.8} />
            いいね
          </button>
          <button type="button" className="hover:text-ink">
            返信
          </button>
        </div>
      </div>
    </article>
  );
}

export function CommentSheet({ open, onClose, title = "コメント", comments = defaultComments }: CommentSheetProps) {
  const [value, setValue] = useState("");
  const visibleComments = useMemo(() => comments, [comments]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/28 px-0" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="コメントを閉じる" onClick={onClose} />
      <div className="relative flex max-h-[76vh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[18px] bg-white shadow-[0_-18px_50px_rgba(17,17,17,0.16)]">
        <div className="border-b border-line/70 px-4 pb-3 pt-2.5">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-neutral-300" />
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-ink">{title}</h2>
            <button type="button" className="grid h-8 w-8 place-items-center rounded-full bg-neutral-50 text-ink" aria-label="閉じる" onClick={onClose}>
              <X aria-hidden="true" size={17} />
            </button>
          </div>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-3">
          <div className="grid gap-2.5">
            {visibleComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        </div>

        <div className="border-t border-line/70 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
          <div className="flex items-end gap-2">
            <textarea
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="コメントを書く..."
              className="max-h-28 min-h-10 flex-1 resize-none rounded-[8px] border border-line bg-neutral-50 px-3 py-2.5 text-sm font-medium leading-relaxed text-ink outline-none placeholder:text-mute/70 focus:border-ink/30 focus:bg-white"
            />
            <button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-white" aria-label="コメントを送信">
              <Send aria-hidden="true" size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
