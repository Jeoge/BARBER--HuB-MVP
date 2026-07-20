"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, Link as LinkIcon, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { LoadingSubmitButton } from "@/components/LoadingButton";
import { OfficialSourceCsvDownloadButton } from "@/components/OfficialSourceCsvDownloadButton";
import type { BarberShopSourcePreview } from "@/lib/barber-import/source";
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
                <th className="px-2 py-2 font-black">重複</th>
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
        {preview ? <Banner type="success" message={`取得・解析しました。形式: ${preview.format}`} /> : null}
        <div className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <LinkIcon aria-hidden="true" size={17} className="text-blush" />
            公式ページまたは掲載ファイルURL
          </div>
          <form action={formAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              name="sourceUrl"
              type="url"
              inputMode="url"
              required
              placeholder="https://www.example.go.jp/official-list.html"
              className="h-11 min-w-0 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush"
            />
            <LoadingSubmitButton pendingText="取得・解析中..." className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-ink px-4 text-sm font-black text-white">
              取得して確認
              <ArrowRight aria-hidden="true" size={17} />
            </LoadingSubmitButton>
          </form>
          <p className="mt-3 text-xs font-medium leading-relaxed text-mute">
            対応: CSV / TSV / xlsx / HTML table / テキストとして解析できるPDF。画像だけのPDF、複雑なPDF、OCRは対象外です。HTTPSのみ、最大8MB・15秒で取得します。
          </p>
        </div>
      </section>

      {preview ? (
        <div className="mt-5 grid gap-4">
          <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
            <StatCard label="取得件数" value={preview.fetchedCount} />
            <StatCard label="有効件数" value={preview.validCount} />
            <StatCard label="店名空欄" value={preview.blankCounts.name} />
            <StatCard label="住所空欄" value={preview.blankCounts.address} />
            <StatCard label="電話番号空欄" value={preview.blankCounts.phone} />
            <StatCard label="重複候補" value="既存画面" />
            <StatCard label="エラー件数" value={preview.errorCount} />
          </section>

          <section className="grid gap-3 rounded-[8px] border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-relaxed text-amber-900">
            <div className="flex items-start gap-2">
              <AlertTriangle aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
              <p>この画面では既存店舗との重複判定を行いません。CSVダウンロード後、既存画面のプレビューで完全一致・重複候補を確認してください。</p>
            </div>
            <p>代表者氏名など公開に不要な個人情報は出力せず、郵便番号も現行CSV形式に列がないため出力していません。掲載元には取得後の公式URLを設定し、認証状態はすべて「未認証」です。</p>
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
      ) : (
        <div className="mt-5">
          <Banner type="info" message="URLを入力すると、変換後の店舗名・住所・電話番号、空欄、変換時エラーを確認できます。重複判定はCSVを既存画面へ選択した後に行います。" />
        </div>
      )}
    </main>
  );
}
