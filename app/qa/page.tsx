import { CheckCircle2, MessageCircle, Plus, Users } from "lucide-react";
import Link from "next/link";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import {
  QA_CATEGORIES,
  listQaQuestions,
  qaAuthorMeta,
  qaAuthorName,
  qaDateLabel,
  qaExcerpt,
  type QaQuestionWithAuthor,
} from "@/lib/supabase/qa";
import { createClient } from "@/lib/supabase/server";

function QuestionAuthor({ question }: { question: QaQuestionWithAuthor }) {
  const name = qaAuthorName(question);
  const meta = qaAuthorMeta(question);

  return (
    <Link href={`/profiles/${question.user_id}`} className="mt-3 flex min-w-0 items-center gap-2">
      <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-ink text-[0.68rem] font-black text-white">
        {question.profiles?.avatar_url ? <img src={question.profiles.avatar_url} alt="" className="h-full w-full object-cover" /> : name.slice(0, 1)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-black text-ink">{name}</span>
        {meta ? <span className="mt-0.5 block truncate text-[0.64rem] font-semibold text-mute">{meta}</span> : null}
      </span>
    </Link>
  );
}

function QaQuestionCard({ question }: { question: QaQuestionWithAuthor }) {
  return (
    <article className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
      <Link href={`/qa/${question.id}`} className="block">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-blushSoft px-2 py-1 text-[0.64rem] font-black text-blush">{question.category}</span>
          <span className="inline-flex items-center gap-1 text-[0.66rem] font-black text-mute">
            {question.is_resolved ? <CheckCircle2 size={13} /> : <MessageCircle size={13} />}
            {question.is_resolved ? "解決済み" : "受付中"}
          </span>
        </div>
        <h2 className="mt-3 text-[0.98rem] font-black leading-snug text-ink">{question.title}</h2>
        <p className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed text-mute">{qaExcerpt(question.body, 96)}</p>
      </Link>
      <div className="mt-3 flex items-end justify-between gap-3">
        <QuestionAuthor question={question} />
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-mute">
          <Users aria-hidden="true" size={15} />
          回答 {question.answer_count}
        </span>
      </div>
    </article>
  );
}

export default async function QaPage() {
  const supabase = await createClient();
  const { questions, error } = await listQaQuestions(supabase, 40);

  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="Q&A"
        title="理美容師の困りごと相談"
        body="技術・経営・集客・独立の疑問を、業界の経験で解決する場所です。"
      />
      <section className="px-4 pt-4">
        <Link href="/post/qa" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-blush text-sm font-black text-white">
          <Plus aria-hidden="true" size={17} />
          Q&Aで相談する
        </Link>
      </section>
      <section className="pt-4">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1">
          {QA_CATEGORIES.map((category) => (
            <span key={category} className="shrink-0 rounded-full border border-line bg-white px-3 py-2 text-xs font-black text-ink">
              {category}
            </span>
          ))}
        </div>
      </section>
      <section className="grid gap-3 px-4 pt-4">
        {error ? (
          <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
            Q&Aを読み込めませんでした。Supabase SQL Editorで最新migrationが適用済みか確認してください。
          </div>
        ) : null}
        {questions.length === 0 ? (
          <div className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
            <h2 className="text-base font-black text-ink">まだ質問はありません</h2>
            <p className="mt-1 text-sm font-medium leading-relaxed text-mute">最初の相談を投稿すると、ここに表示されます。</p>
            <Link href="/post/qa" className="mt-3 inline-flex h-10 items-center justify-center rounded-[8px] bg-ink px-4 text-xs font-black text-white">
              質問する
            </Link>
          </div>
        ) : (
          questions.map((question) => <QaQuestionCard key={question.id} question={question} />)
        )}
      </section>
    </PageChrome>
  );
}
