import { AlertTriangle, Bot, CheckCircle2, Clock3, ExternalLink, FileText, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { runNewsDraftIngestAction, saveNewsDraftAction } from "./actions";
import { TitleCandidatePicker } from "./TitleCandidatePicker";
import { newsDraftReviewStage, listNewsDrafts, requireNewsReviewAdmin, type NewsDraftRecord } from "@/lib/news-drafts/review";
import { createSupabaseAdminClient, getSupabaseAdminConfigStatus } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type NewsReviewPageProps = {
  searchParams: Promise<{
    tab?: string;
    id?: string;
    saved?: string;
    run?: string;
    error?: string;
    fetched?: string;
    duplicate?: string;
    skipped?: string;
    generated?: string;
    failed?: string;
    sourceErrors?: string;
    work?: string;
    style?: string;
    talk?: string;
  }>;
};

const tabs = [
  { id: "waiting_generation", label: "AI生成待ち" },
  { id: "pending_review", label: "確認待ち" },
  { id: "approved", label: "公開中" },
  { id: "rejected", label: "非掲載" },
  { id: "error", label: "生成エラー" },
] as const;

function dateLabel(value: string | null | undefined) {
  if (!value) return "未設定";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未設定";
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function statusLabel(draft: NewsDraftRecord) {
  if (draft.generation_error) return "生成エラー";
  if (draft.status === "approved") return "公開中";
  if (draft.status === "rejected") return "非掲載";
  if (!draft.draft_title) return "AI生成待ち";
  return "確認待ち";
}

function riskClass(riskLevel: string | null) {
  if (riskLevel === "high") return "border-red-200 bg-red-50 text-red-700";
  if (riskLevel === "medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-line bg-neutral-50 text-mute";
}

function pillarLabel(value: string | null | undefined) {
  if (value === "work") return "WORK";
  if (value === "style") return "STYLE";
  if (value === "talk") return "TALK";
  return "未分類";
}

function relevanceDirectionLabel(value: string | null | undefined) {
  if (value === "direct") return "直接関連";
  if (value === "proposal") return "提案関連";
  if (value === "conversation") return "会話関連";
  return "未設定";
}

function tabHref(tab: string) {
  const params = new URLSearchParams({ tab });
  return `/news-review?${params.toString()}`;
}

function Banner({ type, message }: { type: "success" | "error" | "info"; message: string }) {
  const className =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : type === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-line bg-neutral-50 text-ink";

  return <p className={`rounded-[8px] border px-3 py-2 text-xs font-semibold ${className}`}>{message}</p>;
}

function ConfigPanel({ missing }: { missing: string[] }) {
  return (
    <main className="mx-auto min-h-screen max-w-[860px] bg-white px-4 py-8 text-ink">
      <section className="rounded-[8px] border border-line bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle aria-hidden="true" size={20} className="text-blush" />
          <h1 className="text-lg font-black">ニュース確認画面の設定が不足しています</h1>
        </div>
        <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
          次のサーバー専用環境変数をVercelに追加してください。値は画面やログには表示しません。
        </p>
        <ul className="mt-4 grid gap-2">
          {missing.map((name) => (
            <li key={name} className="rounded-[8px] border border-line bg-neutral-50 px-3 py-2 text-sm font-bold">
              {name}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function RunSummary({ params }: { params: Awaited<NewsReviewPageProps["searchParams"]> }) {
  if (params.error) return <Banner type="error" message={params.error} />;
  if (params.saved) return <Banner type="success" message="下書きを保存しました。" />;
  if (!params.run) return null;

  return (
    <Banner
      type="info"
      message={`収集 ${params.fetched ?? "0"}件 / 重複 ${params.duplicate ?? "0"}件 / 対象外 ${params.skipped ?? "0"}件 / AI生成成功 ${params.generated ?? "0"}件 / 失敗 ${params.failed ?? "0"}件 / WORK ${params.work ?? "0"}件 / STYLE ${params.style ?? "0"}件 / TALK ${params.talk ?? "0"}件 / 取得元エラー ${params.sourceErrors ?? "0"}件`}
    />
  );
}

function DraftList({ drafts, selectedId, activeTab }: { drafts: NewsDraftRecord[]; selectedId?: string; activeTab: string }) {
  if (drafts.length === 0) {
    return <p className="rounded-[8px] border border-line bg-neutral-50 p-4 text-sm font-medium text-mute">この条件の下書きはありません。</p>;
  }

  return (
    <div className="grid gap-2">
      {drafts.map((draft) => (
        <Link
          key={draft.id}
          href={`/news-review?tab=${encodeURIComponent(activeTab)}&id=${encodeURIComponent(draft.id)}`}
          className={`rounded-[8px] border p-3 shadow-sm ${
            selectedId === draft.id ? "border-blush bg-blushSoft" : "border-line bg-white"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-sm font-black text-ink">{draft.draft_title || draft.source_title}</p>
            <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[0.62rem] font-black text-blush">{statusLabel(draft)}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[0.68rem] font-bold text-mute">
            <span>{draft.category || "ニュース"}</span>
            <span>{pillarLabel(draft.content_pillar)}</span>
            {draft.topic_category ? <span>{draft.topic_category}</span> : null}
            <span>{draft.source_name}</span>
            <span>score {draft.relevance_score ?? 0}</span>
            <span className={`rounded-full border px-1.5 ${riskClass(draft.risk_level)}`}>{draft.risk_level ?? "low"}</span>
          </div>
          <p className="mt-1 text-[0.68rem] font-medium text-mute">{dateLabel(draft.source_published_at)}</p>
        </Link>
      ))}
    </div>
  );
}

function DetailForm({ draft }: { draft: NewsDraftRecord | null }) {
  if (!draft) {
    return <p className="rounded-[8px] border border-line bg-neutral-50 p-4 text-sm font-medium text-mute">下書きを選択してください。</p>;
  }

  return (
    <form key={draft.id} action={saveNewsDraftAction} className="space-y-4 rounded-[8px] border border-line bg-white p-4 shadow-sm">
      <input type="hidden" name="id" value={draft.id} />

      <section className="rounded-[8px] border border-line bg-neutral-50 p-3">
        <div className="flex items-center gap-2 text-sm font-black text-ink">
          <FileText aria-hidden="true" size={17} />
          元ニュース
        </div>
        <dl className="mt-3 grid gap-2 text-xs">
          <div>
            <dt className="font-black text-mute">元記事タイトル</dt>
            <dd className="mt-1 font-semibold text-ink">{draft.source_title}</dd>
          </div>
          <div>
            <dt className="font-black text-mute">情報元</dt>
            <dd className="mt-1 font-semibold text-ink">{draft.source_name}</dd>
          </div>
          <div>
            <dt className="font-black text-mute">元記事URL</dt>
            <dd className="mt-1">
              <a href={draft.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-blush">
                情報元を開く
                <ExternalLink aria-hidden="true" size={13} />
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-black text-mute">元記事公開日</dt>
            <dd className="mt-1 font-semibold text-ink">{dateLabel(draft.source_published_at)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-[8px] border border-line bg-neutral-50 p-3">
        <h2 className="text-xs font-black text-mute">内部判定</h2>
        <dl className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
          <div>
            <dt className="font-black text-mute">分類</dt>
            <dd className="mt-1 font-semibold text-ink">{pillarLabel(draft.content_pillar)}</dd>
          </div>
          <div>
            <dt className="font-black text-mute">詳細トピック</dt>
            <dd className="mt-1 font-semibold text-ink">{draft.topic_category || "未設定"}</dd>
          </div>
          <div>
            <dt className="font-black text-mute">関連方向</dt>
            <dd className="mt-1 font-semibold text-ink">{relevanceDirectionLabel(draft.relevance_direction)}</dd>
          </div>
          <div>
            <dt className="font-black text-mute">自動判定</dt>
            <dd className="mt-1 font-semibold text-ink">score {draft.relevance_score ?? 0} / {draft.risk_level ?? "low"}</dd>
          </div>
        </dl>
        {draft.conversation_value ? (
          <div className="mt-3">
            <h3 className="text-xs font-black text-mute">会話・提案への使い方</h3>
            <p className="mt-1 text-sm font-medium leading-relaxed text-ink">{draft.conversation_value}</p>
          </div>
        ) : null}
      </section>

      {draft.generation_error ? <Banner type="error" message={draft.generation_error} /> : null}

      <TitleCandidatePicker candidates={draft.title_candidates} primaryAngle={draft.primary_angle} />

      <label className="block">
        <span className="text-xs font-black text-mute">下書きタイトル</span>
        <input name="draft_title" defaultValue={draft.draft_title ?? ""} className="mt-1 h-11 w-full rounded-[8px] border border-line px-3 text-sm font-semibold outline-none focus:border-blush" />
      </label>

      <label className="block">
        <span className="text-xs font-black text-mute">カテゴリー</span>
        <input name="category" defaultValue={draft.category ?? ""} className="mt-1 h-11 w-full rounded-[8px] border border-line px-3 text-sm font-semibold outline-none focus:border-blush" />
      </label>

      <label className="block">
        <span className="text-xs font-black text-mute">要約</span>
        <textarea name="draft_summary" defaultValue={draft.draft_summary ?? ""} rows={3} className="mt-1 w-full rounded-[8px] border border-line px-3 py-2 text-sm font-medium leading-relaxed outline-none focus:border-blush" />
      </label>

      <label className="block">
        <span className="text-xs font-black text-mute">本文</span>
        <textarea name="draft_body" defaultValue={draft.draft_body ?? ""} rows={9} className="mt-1 w-full rounded-[8px] border border-line px-3 py-2 text-sm font-medium leading-relaxed outline-none focus:border-blush" />
      </label>

      <label className="block">
        <span className="text-xs font-black text-mute">朝礼で使うなら</span>
        <textarea name="morning_tip" defaultValue={draft.morning_tip ?? ""} rows={2} className="mt-1 w-full rounded-[8px] border border-line px-3 py-2 text-sm font-medium leading-relaxed outline-none focus:border-blush" />
      </label>

      <label className="block">
        <span className="text-xs font-black text-mute">お客様との会話で使うなら</span>
        <textarea name="conversation_tip" defaultValue={draft.conversation_tip ?? ""} rows={2} className="mt-1 w-full rounded-[8px] border border-line px-3 py-2 text-sm font-medium leading-relaxed outline-none focus:border-blush" />
      </label>

      <section className="grid gap-3 rounded-[8px] border border-line bg-neutral-50 p-3">
        <div>
          <h2 className="text-xs font-black text-mute">関連性の理由</h2>
          <p className="mt-1 text-sm font-medium leading-relaxed text-ink">{draft.relevance_reason || "未設定"}</p>
        </div>
        <label className="block">
          <span className="text-xs font-black text-mute">ファクトチェックメモ</span>
          <textarea name="fact_check_notes" defaultValue={draft.fact_check_notes ?? ""} rows={4} className="mt-1 w-full rounded-[8px] border border-line bg-white px-3 py-2 text-sm font-medium leading-relaxed outline-none focus:border-blush" />
        </label>
      </section>

      <div className="flex flex-wrap gap-2">
        <p className="basis-full text-xs font-bold text-mute">承認すると公開されます。</p>
        <button name="intent" value="approve" className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-ink px-4 text-sm font-black text-white">
          <CheckCircle2 aria-hidden="true" size={17} />
          承認して公開
        </button>
        <button name="intent" value="pending" className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-line bg-white px-4 text-sm font-black text-ink">
          <Clock3 aria-hidden="true" size={17} />
          保留
        </button>
        <button name="intent" value="reject" className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-red-200 bg-red-50 px-4 text-sm font-black text-red-700">
          <XCircle aria-hidden="true" size={17} />
          非掲載
        </button>
      </div>
    </form>
  );
}

export default async function NewsReviewPage({ searchParams }: NewsReviewPageProps) {
  await requireNewsReviewAdmin();
  const params = await searchParams;
  const config = getSupabaseAdminConfigStatus();

  if (!config.ready) {
    return <ConfigPanel missing={config.missing} />;
  }

  const activeTab = tabs.some((tab) => tab.id === params.tab) ? params.tab! : "pending_review";
  const supabase = createSupabaseAdminClient();
  const { drafts, error } = await listNewsDrafts(supabase);
  const filtered = drafts.filter((draft) => newsDraftReviewStage(draft) === activeTab);
  const selected = filtered.find((draft) => draft.id === params.id) ?? filtered[0] ?? null;

  return (
    <main className="mx-auto min-h-screen max-w-[1040px] bg-white px-4 py-6 text-ink">
      <header className="flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blushSoft px-3 py-1 text-xs font-black text-blush">
            <ShieldCheck aria-hidden="true" size={15} />
            非公開確認画面
          </div>
          <h1 className="mt-3 text-2xl font-black leading-tight">3MIN NEWS 下書き確認</h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
            AI下書きはここで確認・修正します。承認するとトップページの3MIN NEWSに公開されます。
          </p>
        </div>
        <form action={runNewsDraftIngestAction}>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-ink px-4 text-sm font-black text-white">
            <RefreshCw aria-hidden="true" size={17} />
            ニュース収集を実行
          </button>
        </form>
      </header>

      <section className="mt-4 grid gap-3">
        <RunSummary params={params} />
        {error ? <Banner type="error" message="ニュース下書きを取得できませんでした。migration適用状況を確認してください。" /> : null}
      </section>

      <nav className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const count = drafts.filter((draft) => newsDraftReviewStage(draft) === tab.id).length;
          const active = activeTab === tab.id;
          return (
            <Link key={tab.id} href={tabHref(tab.id)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-black ${active ? "bg-ink text-white" : "border border-line bg-white text-ink"}`}>
              {tab.label}
              <span className="ml-1 opacity-70">{count}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 grid gap-5 lg:grid-cols-[360px_1fr]">
        <section>
          <div className="mb-2 flex items-center gap-2 text-sm font-black">
            <Bot aria-hidden="true" size={17} className="text-blush" />
            下書き一覧
          </div>
          <DraftList drafts={filtered} selectedId={selected?.id} activeTab={activeTab} />
        </section>
        <section>
          <DetailForm draft={selected} />
        </section>
      </div>
    </main>
  );
}
