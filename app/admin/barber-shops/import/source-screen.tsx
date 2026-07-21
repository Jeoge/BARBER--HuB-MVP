"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, Link as LinkIcon, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { LoadingSubmitButton } from "@/components/LoadingButton";
import { OfficialSourceCsvDownloadButton } from "@/components/OfficialSourceCsvDownloadButton";
import type { BarberShopSourceAnalysis, BarberShopSourcePreview } from "@/lib/barber-import/source";
import { PREFECTURES } from "@/lib/japanAreas";
import { fetchBarberShopSourceAction, initialOfficialSourceActionState } from "./source-actions";

function Banner({ type, message }: { type: "success" | "error" | "info"; message: string }) {
  const className =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : type === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-line bg-neutral-50 text-ink";

  return <p className={`rounded-[8px] border px-3 py-2 text-xs font-semibold leading-relaxed ${className}`}>{message}</p>;
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[8px] border border-line bg-white p-3">
      <p className="text-[0.66rem] font-black uppercase tracking-[0.12em] text-mute">{label}</p>
      <p className="mt-1 text-xl font-black text-ink">{typeof value === "number" ? value.toLocaleString("ja-JP") : value}</p>
    </div>
  );
}

function ColumnSelect({
  label,
  name,
  headers,
  value,
  disabledIndexes,
  required = false,
}: {
  label: string;
  name: string;
  headers: string[];
  value: number | null;
  disabledIndexes: number[];
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black text-ink">{label}{required ? "" : "（任意）"}</span>
      <select
        name={name}
        required={required}
        defaultValue={value == null ? "" : String(value)}
        className="h-11 min-w-0 rounded-[8px] border border-line bg-white px-2 text-xs font-semibold text-ink outline-none focus:border-blush"
      >
        <option value="" disabled={required}>{required ? "選択してください" : "選択なし"}</option>
        {headers.map((header, index) => (
          <option key={`${index}-${header}`} value={index} disabled={disabledIndexes.includes(index)}>
            {index + 1}. {header || "（空見出し）"}
            {disabledIndexes.includes(index) ? "（個人情報等のため対象外）" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

function SourceAnalysisPanel({ analysis, formAction }: { analysis: BarberShopSourceAnalysis; formAction: (formData: FormData) => void }) {
  return (
    <section className="grid gap-4 rounded-[8px] border border-line bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-sm font-black text-ink">列の対応を確認</h2>
        <p className="mt-1 text-xs font-medium leading-relaxed text-mute">
          自動判定を初期値にしています。店名だけ必須です。住所・電話番号は「選択なし」のままでもCSVを作成できます。
        </p>
        <p className="mt-2 text-xs font-semibold leading-relaxed text-mute">
          取得件数（このURL）: {analysis.pageDisplayCount.toLocaleString("ja-JP")}件 / ページ内表示件数: {analysis.pageDisplayCount.toLocaleString("ja-JP")}件
        </p>
        <p className="mt-1 break-all text-[0.68rem] font-medium leading-relaxed text-mute">
          取得先: {analysis.finalUrl} / 形式: {analysis.format} / HTTP {analysis.responseStatus} / {analysis.contentType} / 文字コード: {analysis.encoding === "binary" ? "バイナリ" : analysis.encoding.toUpperCase()} / table: {analysis.tableCount}件 / 表データ: {analysis.pageDisplayCount}件
        </p>
        {analysis.paginationDetected ? (
          <div className="mt-2">
            <Banner type="info" message={`ページネーションを検出しました。このURLから取得した1ページ分のみです。${analysis.reportedTotalCount == null ? "全件ではありません。" : `全${analysis.reportedTotalCount.toLocaleString("ja-JP")}件ではありません。`} 必要なページのURL、CSV、Excel、PDFを指定してください。`} />
          </div>
        ) : null}
      </div>
      <form action={formAction} className="grid gap-3">
        <input type="hidden" name="mode" value="create" />
        <input type="hidden" name="sourceUrl" value={analysis.sourceUrl} />
        <input type="hidden" name="prefecture" value={analysis.prefecture} />
        <input type="hidden" name="municipality" value={analysis.municipality} />
        <input type="hidden" name="sourceName" value={analysis.sourceName} />
        <div className="grid gap-3 sm:grid-cols-3">
          <ColumnSelect label="店名に対応する列" name="nameColumn" headers={analysis.headers} value={analysis.autoMapping.name} disabledIndexes={analysis.excludedColumnIndexes} required />
          <ColumnSelect label="住所に対応する列" name="addressColumn" headers={analysis.headers} value={analysis.autoMapping.address} disabledIndexes={analysis.excludedColumnIndexes} />
          <ColumnSelect label="電話番号に対応する列" name="phoneColumn" headers={analysis.headers} value={analysis.autoMapping.phone} disabledIndexes={analysis.excludedColumnIndexes} />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold leading-relaxed text-mute">取得先: {analysis.finalUrl} / 形式: {analysis.format}</p>
          <LoadingSubmitButton pendingText="CSV作成中..." className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-ink px-4 text-sm font-black text-white">
            この列でCSVを作成
            <ArrowRight aria-hidden="true" size={17} />
          </LoadingSubmitButton>
        </div>
      </form>
      <div className="overflow-x-auto rounded-[8px] border border-line">
        <table className="min-w-[720px] text-left text-xs">
          <thead className="border-b border-line bg-neutral-50 text-mute">
            <tr>{analysis.headers.map((header, index) => <th key={`${index}-${header}`} className="px-2 py-2 font-black">{index + 1}. {header || "（空見出し）"}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-line">
            {analysis.sampleRows.map((row, rowIndex) => (
              <tr key={rowIndex}>{analysis.headers.map((_, columnIndex) => <td key={columnIndex} className="max-w-[14rem] px-2 py-2 font-medium text-ink">{row[columnIndex] || ""}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ResultTable({ preview }: { preview: BarberShopSourcePreview }) {
  const rows = preview.rows;
  return (
    <section className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-black text-ink">変換後の内容</h2>
        <span className="text-xs font-semibold text-mute">先頭{rows.length.toLocaleString("ja-JP")}件を表示</span>
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-semibold text-mute">表示できる行がありません。</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-[8px] border border-line">
          <table className="min-w-[860px] text-left text-xs">
            <thead className="border-b border-line bg-neutral-50 text-mute">
              <tr>
                <th className="px-2 py-2 font-black">行</th>
                <th className="px-2 py-2 font-black">店名</th>
                <th className="px-2 py-2 font-black">都道府県</th>
                <th className="px-2 py-2 font-black">市区町村</th>
                <th className="px-2 py-2 font-black">住所</th>
                <th className="px-2 py-2 font-black">電話番号</th>
                <th className="px-2 py-2 font-black">重複確認</th>
                <th className="px-2 py-2 font-black">確認</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <tr key={row.rowNumber}>
                  <td className="whitespace-nowrap px-2 py-2 font-bold text-mute">{row.rowNumber}</td>
                  <td className="max-w-[12rem] px-2 py-2 font-black text-ink">{row.name || "店名未登録"}</td>
                  <td className="whitespace-nowrap px-2 py-2 font-semibold text-ink">{row.prefecture || "未確認"}</td>
                  <td className="whitespace-nowrap px-2 py-2 font-semibold text-ink">{row.municipality || "未確認"}</td>
                  <td className="max-w-[18rem] px-2 py-2 font-medium text-ink">{row.address || "住所未登録"}</td>
                  <td className="whitespace-nowrap px-2 py-2 font-semibold text-ink">{row.phone || "電話番号未登録"}</td>
                  <td className="whitespace-nowrap px-2 py-2 font-bold text-mute">既存画面で確認</td>
                  <td className="max-w-[16rem] px-2 py-2 font-medium leading-relaxed text-mute">
                    {row.validationErrors.length > 0 ? row.validationErrors.join(" / ") : "簡易確認済み"}
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

export function OfficialSourceScreen() {
  const [state, formAction] = useActionState(fetchBarberShopSourceAction, initialOfficialSourceActionState);
  const analysis = state.analysis;
  const preview = state.preview;

  return (
    <main className="mx-auto min-h-screen max-w-[1040px] bg-white px-4 py-6 text-ink">
      <header className="flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blushSoft px-3 py-1 text-xs font-black text-blush">
            <ShieldCheck aria-hidden="true" size={15} />
            非公開管理画面
          </div>
          <h1 className="mt-3 text-2xl font-black leading-tight">公式一覧からCSVを作成</h1>
          <p className="mt-2 max-w-[46rem] text-sm font-medium leading-relaxed text-mute">
            自治体・保健所の公式ページまたは掲載ファイルを取得し、現在の店舗CSV形式へ変換します。確認後の登録は既存のCSV取込画面で管理者が実行します。
          </p>
        </div>
        <Link href="/admin/barber-shops/import" className="inline-flex h-10 items-center justify-center rounded-[8px] border border-line bg-white px-3 text-xs font-black text-ink">
          CSV取込へ戻る
        </Link>
      </header>

      <section className="mt-4 grid gap-3">
        {state.error ? <Banner type="error" message={state.error} /> : null}
        {analysis && !preview ? <Banner type="success" message={`取得・解析しました。列の対応を確認してください。形式: ${analysis.format}`} /> : null}
        {preview ? <Banner type="success" message={`CSVを作成しました。形式: ${preview.format}`} /> : null}
        <div className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <LinkIcon aria-hidden="true" size={17} className="text-blush" />
            公式ページまたは掲載ファイルURL
          </div>
          <form action={formAction} className="mt-4 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                name="sourceUrl"
                type="url"
                inputMode="url"
                required
                defaultValue={analysis?.sourceUrl ?? ""}
                placeholder="https://www.example.go.jp/official-list.html"
                className="h-11 min-w-0 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush"
              />
              <LoadingSubmitButton pendingText="取得・解析中..." className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-ink px-4 text-sm font-black text-white">
                取得して確認
                <ArrowRight aria-hidden="true" size={17} />
              </LoadingSubmitButton>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-xs font-black text-ink">都道府県（元データにない場合の補完）</span>
                <select name="prefecture" defaultValue={analysis?.prefecture ?? ""} className="h-11 min-w-0 rounded-[8px] border border-line bg-white px-2 text-xs font-semibold text-ink outline-none focus:border-blush">
                  <option value="">未選択</option>
                  {PREFECTURES.map((prefecture) => <option key={prefecture} value={prefecture}>{prefecture}</option>)}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-black text-ink">市区町村（任意・補完用）</span>
                <input name="municipality" defaultValue={analysis?.municipality ?? ""} placeholder="例：○○市" className="h-11 min-w-0 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush" />
              </label>
              <label className="grid gap-2">
                <span className="text-xs font-black text-ink">掲載元名</span>
                <input name="sourceName" defaultValue={analysis?.sourceName ?? ""} placeholder="例：○○市保健所 公式一覧" className="h-11 min-w-0 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush" />
              </label>
            </div>
          </form>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
            組合サイトは「○○県理容生活衛生同業組合 組合加盟店一覧」など、公的な全施設一覧と区別できる掲載元名を入力してください。
          </p>
          <p className="mt-3 text-xs font-medium leading-relaxed text-mute">
            対応: CSV / TSV / xlsx / HTML table / テキスト抽出可能なPDF。画像だけのPDF、OCR、CAPTCHA、ログイン必須・JavaScript操作が必要な一覧は対象外です。HTTPSのみ、最大8MB・15秒で取得します。
          </p>
        </div>
      </section>

      {preview ? (
        <div className="mt-5 grid gap-4">
          <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
            <StatCard label="取得件数（このURL）" value={preview.fetchedCount} />
            <StatCard label="ページ内表示件数" value={preview.pageDisplayCount} />
            {preview.reportedTotalCount == null ? null : <StatCard label="サイト表示の全件数" value={preview.reportedTotalCount} />}
            <StatCard label="出力予定件数" value={preview.outputCount} />
            <StatCard label="店名空欄" value={preview.blankCounts.name} />
            <StatCard label="都道府県空欄" value={preview.blankCounts.prefecture} />
            <StatCard label="市区町村空欄" value={preview.blankCounts.municipality} />
            <StatCard label="住所空欄" value={preview.blankCounts.address} />
            <StatCard label="電話番号空欄" value={preview.blankCounts.phone} />
            <StatCard label="掲載元空欄" value={preview.blankCounts.source} />
            <StatCard label="除外行数" value={preview.excludedCount} />
            <StatCard label="エラー件数" value={preview.errorCount} />
          </section>

          {preview.paginationDetected ? (
            <Banner type="info" message={`ページネーションを検出しました。このURLから取得した1ページ分のみです。${preview.reportedTotalCount == null ? "全件ではありません。" : `全${preview.reportedTotalCount.toLocaleString("ja-JP")}件ではありません。`} 必要なページのURL、CSV、Excel、PDFを指定してください。`} />
          ) : null}

          <section className="grid gap-3 rounded-[8px] border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-relaxed text-amber-900">
            <div className="flex items-start gap-2">
              <AlertTriangle aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
              <p>この画面では既存店舗との重複判定を行いません。CSVダウンロード後、既存画面のプレビューで完全一致・重複候補を確認してください。</p>
            </div>
            <p>取得先: <span className="break-all">{preview.finalUrl}</span> / 形式: {preview.format} / HTTP {preview.responseStatus} / {preview.contentType} / 文字コード: {preview.encoding === "binary" ? "バイナリ" : preview.encoding.toUpperCase()} / table: {preview.tableCount}件。代表者氏名など公開に不要な個人情報は出力せず、郵便番号も現行CSV形式に列がないため出力していません。掲載元名は入力値を使い、認証状態はすべて「未認証」です。式として解釈される先頭文字はCSV側で安全化します。</p>
          </section>

          <ResultTable preview={preview} />

          <section className="flex flex-col gap-3 rounded-[8px] border border-line bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
            <OfficialSourceCsvDownloadButton csv={preview.csv} fileName={preview.fileName} />
            <Link href="/admin/barber-shops/import" className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-ink px-4 text-sm font-black text-white">
              既存のCSVインポート画面へ進む
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
            <div className="basis-full text-xs font-semibold leading-relaxed text-mute">
              <CheckCircle2 aria-hidden="true" size={15} className="mr-1 inline text-emerald-600" />
              この画面では店舗登録も既存プレビュー作成も行いません。CSVをダウンロードして既存画面で選択し、そこで最終確認・登録してください。
            </div>
          </section>
        </div>
      ) : analysis ? (
        <div className="mt-5 grid gap-4">
          <SourceAnalysisPanel analysis={analysis} formAction={formAction} />
        </div>
      ) : (
        <div className="mt-5">
          <Banner type="info" message="URLを入力すると、変換後の店舗名・住所・電話番号、空欄、変換時エラーを確認できます。重複判定はCSVを既存画面へ選択した後に行います。" />
        </div>
      )}
    </main>
  );
}
