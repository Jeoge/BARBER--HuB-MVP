import { CheckCircle2, MessageCircle, MessageSquare, Users } from "lucide-react";
import Link from "next/link";
import type { QaQuestionWithAuthor } from "@/lib/supabase/qa";

type QASectionProps = {
  questions: QaQuestionWithAuthor[];
};

export function QASection({ questions }: QASectionProps) {
  return (
    <section className="pt-7">
      <div className="mb-3 flex items-end justify-between gap-3 px-4">
        <h2 className="text-[1.06rem] font-black uppercase tracking-[0.08em] text-ink">Q&A</h2>
        <Link
          href="/post/qa"
          aria-label="Q&Aで相談する みんなで解決"
          className="inline-flex min-h-11 flex-col items-end justify-center rounded-[8px] px-2.5 text-right text-blush transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blush/35 active:scale-[0.98]"
        >
          <span className="text-[0.86rem] font-black leading-none">相談する</span>
          <span className="mt-1 text-[0.68rem] font-bold leading-none text-blush/80">みんなで解決</span>
        </Link>
      </div>
      {questions.length > 0 ? (
        <div className="grid gap-2 px-4">
          {questions.map((question) => (
            <Link
              key={question.id}
              href={`/qa/${question.id}`}
              className="rounded-[8px] border border-line bg-white px-3 py-2.5 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blush/35 active:scale-[0.99]"
            >
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5 text-blush">
                <span className="inline-flex items-center gap-1 rounded-full bg-blushSoft px-2 py-0.5 text-[0.64rem] font-black">
                  <MessageSquare aria-hidden="true" size={13} />
                  {question.category}
                </span>
                <span className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-mute">
                  {question.is_resolved ? <CheckCircle2 aria-hidden="true" size={13} /> : <MessageCircle aria-hidden="true" size={13} />}
                  {question.is_resolved ? "解決済み" : "受付中"}
                </span>
              </div>
              <h3 className="line-clamp-2 text-[0.98rem] font-black leading-snug text-ink">{question.title}</h3>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-mute">
                <Users aria-hidden="true" size={15} />
                コメント {question.answer_count}
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
