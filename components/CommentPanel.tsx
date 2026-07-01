"use client";

import { Send } from "lucide-react";
import { useState } from "react";

type CommentPanelProps = {
  title?: string;
  placeholder?: string;
  comments?: Array<{
    author: string;
    body: string;
  }>;
};

const defaultComments = [
  {
    author: "BARBER HUB編集部",
    body: "現場で試しやすい形に整理して、あとから見返せるようにしています。",
  },
  {
    author: "個人理容師",
    body: "自分の店でも応用できそうです。こういう実例があると助かります。",
  },
];

export function CommentPanel({
  title = "コメント",
  placeholder = "経験や気づきをコメントする",
  comments = defaultComments,
}: CommentPanelProps) {
  const [value, setValue] = useState("");

  return (
    <section id="comments" className="px-4 pt-7">
      <div className="rounded-[8px] border border-line/80 bg-white p-3.5 shadow-[0_8px_20px_rgba(17,17,17,0.035)]">
        <h2 className="text-base font-black text-ink">{title}</h2>
        <div className="mt-3 grid gap-2">
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
            className="min-h-24 w-full resize-none rounded-[8px] border border-line bg-neutral-50 px-3 py-2.5 text-sm font-medium leading-relaxed text-ink outline-none transition placeholder:text-mute/70 focus:border-ink/30 focus:bg-white"
          />
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[8px] bg-ink px-4 text-sm font-black text-white"
          >
            <Send aria-hidden="true" size={15} />
            コメントする
          </button>
        </div>
        <div className="mt-4 grid gap-2">
          {comments.map((comment) => (
            <div key={`${comment.author}-${comment.body}`} className="rounded-[8px] bg-neutral-50 p-3">
              <p className="text-xs font-black text-ink">{comment.author}</p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-mute">{comment.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
