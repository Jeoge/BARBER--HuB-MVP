import { ArrowLeft, CheckCircle2, Send, Users } from "lucide-react";
import Link from "next/link";
import { FormDisclaimer } from "@/components/FormDisclaimer";
import { LoadingSubmitButton } from "@/components/LoadingButton";
import { PageChrome } from "@/components/PageChrome";
import { pathWithParams } from "@/lib/auth/redirects";
import {
  getQaQuestionById,
  listQaAnswers,
  qaAuthorMeta,
  qaAuthorName,
  qaDateLabel,
  type QaAnswer,
} from "@/lib/supabase/qa";
import { createClient } from "@/lib/supabase/server";
import { createQaAnswerAction } from "../actions";

type QaDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ posted?: string; answer?: string; answerError?: string }>;
};

function AnswerAuthor({ answer }: { answer: QaAnswer }) {
  const name = qaAuthorName(answer);
  const meta = qaAuthorMeta(answer);

  return (
    <Link href={`/profiles/${answer.user_id}`} className="flex min-w-0 items-center gap-2">
      <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-ink text-[0.68rem] font-black text-white">
        {answer.profiles?.avatar_url ? <img src={answer.profiles.avatar_url} alt="" className="h-full w-full object-cover" /> : name.slice(0, 1)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-black text-ink">{name}</span>
        <span className="mt-0.5 block truncate text-[0.66rem] font-bold text-mute">
          {[meta, qaDateLabel({ created_at: answer.created_at })].filter(Boolean).join(" / ")}
        </span>
      </span>
    </Link>
  );
}

function AnswerItem({ answer }: { answer: QaAnswer }) {
  return (
    <article className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <AnswerAuthor answer={answer} />
        {answer.is_best_answer ? (
          <span className="shrink-0 rounded-full bg-blushSoft px-2 py-1 text-[0.62rem] font-black text-blush">BEST</span>
        ) : null}
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-ink">{answer.body}</p>
    </article>
  );
}

export default async function QaDetailPage({ params, searchParams }: QaDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { question, error: questionError } = await getQaQuestionById(supabase, id);

  if (question == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-4">
          <Link href="/qa" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
            <ArrowLeft aria-hidden="true" size={17} />
            Q&Aへ戻る
          </Link>
        </section>
        <section className="px-4 pt-8">
          <h1 className="text-2xl font-black text-ink">相談が見つかりません</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
            指定された相談は削除されたか、まだ登録されていません。
          </p>
          {questionError ? (
            <p className="mt-3 rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
              Supabase SQL Editorで最新migrationが適用済みか確認してください。
            </p>
          ) : null}
          <Link href="/qa" className="mt-5 inline-flex h-11 items-center justify-center rounded-[8px] bg-blush px-4 text-sm font-black text-white">
            Q&Aへ戻る
          </Link>
        </section>
      </PageChrome>
    );
  }

  const { answers, error: answersError } = await listQaAnswers(supabase, question.id, 80);
  const authorName = qaAuthorName(question);
  const authorMeta = qaAuthorMeta(question);

  return (
    <PageChrome>
      <section className="px-4 pt-4">
        <Link href="/qa" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
          <ArrowLeft aria-hidden="true" size={17} />
          Q&Aへ戻る
        </Link>
      </section>
      <article className="px-4 pt-5">
        {query?.posted === "1" ? (
          <div className="mb-3 rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-sm font-black text-ink">質問を投稿しました。</div>
        ) : null}
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-blushSoft px-2.5 py-1 text-[0.68rem] font-black text-blush">
            {question.category}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-black text-mute">
            {question.is_resolved ? <CheckCircle2 size={14} /> : <Users size={14} />}
            {question.is_resolved ? "解決済み" : "受付中"}
          </span>
        </div>
        <h1 className="mt-3 text-[1.45rem] font-black leading-tight text-ink">{question.title}</h1>
        <Link href={`/profiles/${question.user_id}`} className="mt-3 flex min-w-0 items-center gap-2">
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-ink text-sm font-black text-white">
            {question.profiles?.avatar_url ? <img src={question.profiles.avatar_url} alt="" className="h-full w-full object-cover" /> : authorName.slice(0, 1)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-ink">{authorName}</span>
            <span className="mt-0.5 block truncate text-xs font-semibold text-mute">
              {[authorMeta, qaDateLabel(question)].filter(Boolean).join(" / ")}
            </span>
          </span>
        </Link>
        <p className="mt-4 rounded-[8px] border border-line bg-white p-4 text-[0.92rem] font-medium leading-relaxed text-ink shadow-sm">
          {question.body}
        </p>
        <div className="mt-4 flex items-center gap-4 text-sm font-bold text-mute">
          <span className="inline-flex items-center gap-1">
            <Users aria-hidden="true" size={16} />
            回答 {answers.length}
          </span>
        </div>
      </article>

      <section className="px-4 pt-7">
        <h2 className="text-base font-black text-ink">回答</h2>
        {query?.answer === "posted" ? (
          <div className="mt-3 rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-sm font-black text-ink">回答しました。</div>
        ) : null}
        {answersError ? (
          <div className="mt-3 rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
            回答を読み込めませんでした。最新migrationを確認してください。
          </div>
        ) : null}
        <div className="mt-3 grid gap-2">
          {answers.length === 0 ? (
            <div className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
              <p className="text-sm font-black text-ink">まだ回答はありません</p>
              <p className="mt-1 text-xs font-medium leading-relaxed text-mute">経験や考えを残すと、同じ悩みの人にも役立ちます。</p>
            </div>
          ) : (
            answers.map((answer) => <AnswerItem key={answer.id} answer={answer} />)
          )}
        </div>
      </section>

      <section className="px-4 pt-5">
        {user == null ? (
          <div className="rounded-[10px] border border-line bg-white p-4 shadow-sm">
            <h2 className="text-base font-black text-ink">回答するにはログインしてください</h2>
            <p className="mt-1 text-sm font-medium leading-relaxed text-mute">ログイン後、この相談に回答できます。</p>
            <Link
              href={pathWithParams("/login", { next: `/qa/${question.id}`, message: "回答にはログインしてください。" })}
              className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-blush text-sm font-black text-white"
            >
              ログインする
            </Link>
          </div>
        ) : (
          <form action={createQaAnswerAction} className="rounded-[10px] border border-line bg-white p-3 shadow-sm">
            <input type="hidden" name="questionId" value={question.id} />
            {query?.answerError ? (
              <div className="mb-3 rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
                {query.answerError}
              </div>
            ) : null}
            <label className="grid gap-2">
              <span className="text-sm font-black text-ink">回答する</span>
              <textarea
                name="body"
                rows={5}
                maxLength={2000}
                required
                className="resize-none rounded-[8px] border border-line bg-neutral-50 px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush focus:bg-white"
                placeholder="経験談、考え方、確認した方がよい点などを書いてください。"
              />
            </label>
            <LoadingSubmitButton pendingText="回答中..." className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-blush text-sm font-black text-white">
              <Send aria-hidden="true" size={16} />
              回答を投稿
            </LoadingSubmitButton>
            <FormDisclaimer className="mt-2">
              回答は経験共有として投稿してください。断定、攻撃、専門家の判断が必要な内容の言い切りには注意してください。
            </FormDisclaimer>
          </form>
        )}
      </section>
    </PageChrome>
  );
}
