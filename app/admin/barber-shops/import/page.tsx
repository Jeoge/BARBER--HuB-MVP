import { AlertTriangle, BarChart3, CheckCircle2, Database, FileSpreadsheet, ShieldCheck, Upload } from "lucide-react";
import Link from "next/link";
import { LoadingSubmitButton } from "@/components/LoadingButton";
import { requireBarberHubAdmin } from "@/lib/admin/permissions";
import {
  expectedHeaderLabel,
  getBarberShopImportPreview,
  type BarberShopImportBatch,
  type BarberShopImportCount,
  type BarberShopImportSummary,
  type BarberShopImportRow,
} from "@/lib/barber-import/importer";
import { PREFECTURES } from "@/lib/japanAreas";
import { createSupabaseAdminClient, getSupabaseAdminConfigStatus } from "@/lib/supabase/admin";
import { executeBarberShopCsvImportAction, uploadBarberShopCsvAction } from "./actions";

export const dynamic = "force-dynamic";

const DEFAULT_EXPECTED_PREFECTURE_FOR_REVIEW = "";
const NO_EXPECTED_PREFECTURE = "__none";

type ImportPageProps = {
  searchParams: Promise<{
    batch?: string;
    uploaded?: string;
    imported?: string;
    encoding?: string;
    error?: string;
    inserted?: string;
    skipped?: string;
    failed?: string;
    expectedPrefecture?: string;
  }>;
};

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
          <h1 className="text-lg font-black">CSV取込画面の設定が不足しています</h1>
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[8px] border border-line bg-white p-3">
      <p className="text-[0.66rem] font-black uppercase tracking-[0.12em] text-mute">{label}</p>
      <p className="mt-1 text-xl font-black text-ink">{value.toLocaleString("ja-JP")}</p>
    </div>
  );
}

function resolveExpectedPrefecture(value: string | undefined) {
  if (value === NO_EXPECTED_PREFECTURE) return "";
  if (value && PREFECTURES.includes(value)) return value;
  return DEFAULT_EXPECTED_PREFECTURE_FOR_REVIEW;
}

function expectedPrefectureFormValue(expectedPrefecture: string) {
  return expectedPrefecture || NO_EXPECTED_PREFECTURE;
}

function CountList({ title, rows, empty, limit = 60 }: { title: string; rows: BarberShopImportCount[]; empty: string; limit?: number }) {
  const visibleRows = rows.slice(0, limit);
  const hiddenCount = Math.max(rows.length - visibleRows.length, 0);

  return (
    <div className="rounded-[8px] border border-line bg-neutral-50 p-3">
      <h3 className="text-xs font-black text-ink">{title}</h3>
      {visibleRows.length === 0 ? (
        <p className="mt-2 text-xs font-semibold text-mute">{empty}</p>
      ) : (
        <div className="mt-2 grid max-h-64 gap-1.5 overflow-y-auto pr-1">
          {visibleRows.map((row) => (
            <p key={row.label} className="flex items-center justify-between gap-3 rounded-[8px] bg-white px-2.5 py-1.5 text-xs">
              <span className="min-w-0 truncate font-semibold text-ink">{row.label}</span>
              <span className="shrink-0 font-black text-ink">{row.count.toLocaleString("ja-JP")}件</span>
            </p>
          ))}
          {hiddenCount > 0 ? <p className="px-1 text-xs font-semibold text-mute">ほか {hiddenCount.toLocaleString("ja-JP")}件</p> : null}
        </div>
      )}
    </div>
  );
}

function ImportSummaryPanel({ summary, expectedPrefecture }: { summary: BarberShopImportSummary; expectedPrefecture: string }) {
  const otherPrefectureCount = expectedPrefecture
    ? summary.prefectureCounts
      .filter((row) => row.label !== expectedPrefecture)
      .reduce((total, row) => total + row.count, 0)
    : 0;

  return (
    <section className="grid gap-3">
      <div className="flex items-center gap-2 text-sm font-black text-ink">
        <BarChart3 aria-hidden="true" size={17} className="text-blush" />
        取込前確認
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <StatCard label="想定外都道府県" value={otherPrefectureCount} />
        <StatCard label="電話番号形式不正" value={summary.invalidPhoneCount} />
        <StatCard label="同一店名・同一住所" value={summary.sameNameAddressCandidateCount} />
      </div>
      {expectedPrefecture && otherPrefectureCount > 0 ? (
        <p className="flex items-start gap-2 rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold leading-relaxed text-amber-800">
          <AlertTriangle aria-hidden="true" size={15} className="mt-0.5 shrink-0" />
          <span>
            今回の想定都道府県: {expectedPrefecture} / 想定外: {otherPrefectureCount.toLocaleString("ja-JP")}件。
            都道府県別件数を確認してください。登録は強制停止しません。
          </span>
        </p>
      ) : null}
      <div className="grid gap-3 lg:grid-cols-3">
        <CountList title="都道府県別件数" rows={summary.prefectureCounts} empty="都道府県を確認できる行はありません。" />
        <CountList title="市区町村別件数" rows={summary.municipalityCounts} empty="市区町村を確認できる行はありません。" />
        <CountList title="空欄件数" rows={summary.blankCounts} empty="空欄はありません。" />
      </div>
    </section>
  );
}

function duplicateLabel(type: BarberShopImportRow["duplicate_type"]) {
  if (type === "exact") return "完全一致";
  if (type === "file_exact") return "CSV内完全一致";
  if (type === "candidate") return "重複候補";
  return "なし";
}

function importStatusLabel(status: BarberShopImportRow["import_status"]) {
  if (status === "inserted") return "登録済み";
  if (status === "skipped") return "スキップ";
  if (status === "failed") return "失敗";
  return "登録前";
}

function RowTable({ title, rows, empty }: { title: string; rows: BarberShopImportRow[]; empty: string }) {
  return (
    <section className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
      <h2 className="text-sm font-black text-ink">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-semibold text-mute">{empty}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[820px] text-left text-xs">
            <thead className="border-b border-line text-mute">
              <tr>
                <th className="px-2 py-2 font-black">行</th>
                <th className="px-2 py-2 font-black">店名</th>
                <th className="px-2 py-2 font-black">市区町村</th>
                <th className="px-2 py-2 font-black">住所</th>
                <th className="px-2 py-2 font-black">電話番号</th>
                <th className="px-2 py-2 font-black">重複</th>
                <th className="px-2 py-2 font-black">登録</th>
                <th className="px-2 py-2 font-black">確認</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap px-2 py-2 font-bold text-mute">{row.row_number}</td>
                  <td className="max-w-[12rem] px-2 py-2 font-black text-ink">{row.name}</td>
                  <td className="whitespace-nowrap px-2 py-2 font-semibold text-ink">{row.municipality}</td>
                  <td className="max-w-[16rem] px-2 py-2 font-medium text-ink">{row.address || "住所未登録"}</td>
                  <td className="whitespace-nowrap px-2 py-2 font-semibold text-ink">{row.phone || "電話番号未登録"}</td>
                  <td className="whitespace-nowrap px-2 py-2 font-bold text-ink">{duplicateLabel(row.duplicate_type)}</td>
                  <td className="whitespace-nowrap px-2 py-2 font-bold text-ink">{importStatusLabel(row.import_status)}</td>
                  <td className="min-w-[10rem] px-2 py-2 font-medium text-mute">
                    {row.validation_errors.length > 0 ? row.validation_errors.join(" / ") : null}
                    {row.import_error ? row.import_error : null}
                    {row.duplicate_shop_ids.length > 0 ? (
                      <span className="inline-flex flex-wrap gap-1">
                        {row.duplicate_shop_ids.map((id) => (
                          <Link key={id} href={`/stores/${id}`} className="font-black text-blush">
                            既存店舗
                          </Link>
                        ))}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function UploadPanel({ expectedPrefecture }: { expectedPrefecture: string }) {
  return (
    <section className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-black text-ink">
        <FileSpreadsheet aria-hidden="true" size={17} className="text-blush" />
        CSV選択
      </div>
      <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
        必須列: {expectedHeaderLabel()}
      </p>
      <form action={uploadBarberShopCsvAction} className="mt-4 grid gap-3">
        <label className="grid gap-2">
          <span className="text-xs font-black text-ink">想定都道府県（確認用・任意）</span>
          <select
            name="expectedPrefecture"
            defaultValue={expectedPrefectureFormValue(expectedPrefecture)}
            className="h-11 rounded-[8px] border border-line bg-white px-2 text-xs font-semibold text-ink outline-none focus:border-blush"
          >
            <option value={NO_EXPECTED_PREFECTURE}>指定なし</option>
            {PREFECTURES.map((prefecture) => (
              <option key={prefecture} value={prefecture}>
                {prefecture}
              </option>
            ))}
          </select>
        </label>
        <input
          name="csv"
          type="file"
          accept=".csv,text/csv"
          required
          className="w-full rounded-[8px] border border-line bg-neutral-50 px-3 py-3 text-sm font-semibold text-ink file:mr-3 file:rounded-[8px] file:border-0 file:bg-ink file:px-3 file:py-2 file:text-xs file:font-black file:text-white"
        />
        <LoadingSubmitButton pendingText="プレビュー作成中..." className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-ink px-4 text-sm font-black text-white">
          <Upload aria-hidden="true" size={17} />
          内容をプレビュー
        </LoadingSubmitButton>
      </form>
    </section>
  );
}

function ExecutePanel({ batch, expectedPrefecture }: { batch: BarberShopImportBatch; expectedPrefecture: string }) {
  if (batch.status !== "previewed") {
    return (
      <section className="rounded-[8px] border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">
        このバッチは登録実行済みです。
      </section>
    );
  }

  return (
    <section className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-black text-ink">
        <Database aria-hidden="true" size={17} className="text-blush" />
        登録実行
      </div>
      <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
        完全一致とエラー行は登録しません。重複候補はチェックした場合だけ登録対象に含めます。
      </p>
      <form action={executeBarberShopCsvImportAction} className="mt-4 grid gap-3">
        <input type="hidden" name="batchId" value={batch.id} />
        <input type="hidden" name="expectedPrefecture" value={expectedPrefectureFormValue(expectedPrefecture)} />
        {batch.duplicate_candidate_count > 0 ? (
          <label className="flex items-start gap-2 rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-ink">
            <input name="includeCandidates" value="yes" type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-ink" />
            重複候補 {batch.duplicate_candidate_count.toLocaleString("ja-JP")}件を確認し、登録対象に含める
          </label>
        ) : (
          <input type="hidden" name="includeCandidates" value="yes" />
        )}
        <LoadingSubmitButton pendingText="登録中..." className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-ink px-4 text-sm font-black text-white">
          <CheckCircle2 aria-hidden="true" size={17} />
          登録を実行
        </LoadingSubmitButton>
      </form>
    </section>
  );
}

function PreviewPanel({ preview, expectedPrefecture }: { preview: NonNullable<Awaited<ReturnType<typeof getBarberShopImportPreview>>>; expectedPrefecture: string }) {
  const { batch } = preview;

  return (
    <div className="grid gap-4">
      <section className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[0.66rem] font-black uppercase tracking-[0.12em] text-blush">IMPORT BATCH</p>
            <h2 className="mt-1 text-lg font-black text-ink">{batch.file_name}</h2>
            <p className="mt-1 text-xs font-semibold text-mute">Batch ID: {batch.id}</p>
          </div>
          <span className="inline-flex w-fit rounded-full border border-line bg-neutral-50 px-3 py-1 text-xs font-black text-ink">
            {batch.status === "imported" ? "登録済み" : "プレビュー中"}
          </span>
        </div>
        {batch.source_summary ? (
          <p className="mt-3 rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-semibold leading-relaxed text-mute">
            {batch.source_summary}
          </p>
        ) : null}
      </section>

      <section className="grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
        <StatCard label="CSV行数" value={batch.row_count} />
        <StatCard label="正常件数" value={batch.valid_row_count} />
        <StatCard label="エラー" value={batch.error_count} />
        <StatCard label="完全一致" value={batch.duplicate_exact_count} />
        <StatCard label="重複候補" value={batch.duplicate_candidate_count} />
        <StatCard label="登録済み" value={batch.inserted_count} />
        <StatCard label="スキップ" value={batch.skipped_count} />
      </section>

      <ImportSummaryPanel summary={preview.summary} expectedPrefecture={expectedPrefecture} />
      <ExecutePanel batch={batch} expectedPrefecture={expectedPrefecture} />
      <RowTable title="必須項目・重複確認" rows={preview.issueRows} empty="エラー行や重複候補はありません。" />
      <RowTable title="内容プレビュー" rows={preview.sampleRows} empty="プレビューできる行がありません。" />
      {batch.status === "imported" ? <RowTable title="登録結果" rows={preview.resultRows} empty="登録結果行はありません。" /> : null}
    </div>
  );
}

export default async function BarberShopCsvImportPage({ searchParams }: ImportPageProps) {
  await requireBarberHubAdmin();
  const params = await searchParams;
  const config = getSupabaseAdminConfigStatus();
  const expectedPrefecture = resolveExpectedPrefecture(params.expectedPrefecture);

  if (!config.ready) {
    return <ConfigPanel missing={config.missing} />;
  }

  const preview = params.batch ? await getBarberShopImportPreview(createSupabaseAdminClient(), params.batch) : null;

  return (
    <main className="mx-auto min-h-screen max-w-[1040px] bg-white px-4 py-6 text-ink">
      <header className="flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blushSoft px-3 py-1 text-xs font-black text-blush">
            <ShieldCheck aria-hidden="true" size={15} />
            非公開管理画面
          </div>
          <h1 className="mt-3 text-2xl font-black leading-tight">店舗CSV取込</h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
            店舗CSVをプレビューしてから登録します。CSV取込機能は全国共通です。想定都道府県を指定した場合は都道府県別件数で混入を確認します。
          </p>
        </div>
        <Link href="/" className="inline-flex h-10 items-center justify-center rounded-[8px] border border-line bg-white px-3 text-xs font-black text-ink">
          BARBER HUBへ戻る
        </Link>
      </header>

      <section className="mt-4 grid gap-3">
        {params.error ? <Banner type="error" message={params.error} /> : null}
        {params.uploaded ? <Banner type="success" message={`CSVプレビューを作成しました。文字コード: ${params.encoding ?? "確認済み"}`} /> : null}
        {params.imported ? (
          <Banner
            type="success"
            message={`CSV取込を実行しました。登録 ${params.inserted ?? "0"}件 / スキップ ${params.skipped ?? "0"}件 / 失敗 ${params.failed ?? "0"}件`}
          />
        ) : null}
        {params.batch && !preview ? <Banner type="error" message="取込バッチを取得できませんでした。" /> : null}
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[320px_1fr]">
        <UploadPanel expectedPrefecture={expectedPrefecture} />
        {preview ? (
          <PreviewPanel preview={preview} expectedPrefecture={expectedPrefecture} />
        ) : (
          <Banner type="info" message="CSVを選択するとプレビュー、必須項目、重複候補を確認できます。" />
        )}
      </div>
    </main>
  );
}
