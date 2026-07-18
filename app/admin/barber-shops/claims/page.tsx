import { AlertTriangle, CheckCircle2, ExternalLink, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { listPendingBarberShopClaimsForAdmin, type AdminBarberShopClaim } from "@/lib/admin/barber-shop-claims";
import { requireBarberHubAdmin } from "@/lib/admin/permissions";
import { createSupabaseAdminClient, getSupabaseAdminConfigStatus } from "@/lib/supabase/admin";
import { reviewBarberShopClaimAction } from "./actions";

export const dynamic = "force-dynamic";

type ClaimsPageProps = {
  searchParams: Promise<{
    approved?: string;
    rejected?: string;
    error?: string;
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
          <h1 className="text-lg font-black">店舗管理申請の審査画面の設定が不足しています</h1>
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

function dateLabel(value: string | null | undefined) {
  if (!value) return "未設定";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未設定";
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function textOrUnset(value: string | null | undefined) {
  const text = value?.trim();
  return text && text.length > 0 ? text : "未登録";
}

function sourceLabel(value: string | null | undefined) {
  return textOrUnset(value);
}

function statusLabel(status: AdminBarberShopClaim["status"]) {
  if (status === "pending") return "確認中";
  if (status === "approved") return "承認済み";
  if (status === "rejected") return "却下";
  return "キャンセル";
}

function ClaimReviewForm({ claim }: { claim: AdminBarberShopClaim }) {
  return (
    <form action={reviewBarberShopClaimAction} className="grid min-w-[15rem] gap-2">
      <input type="hidden" name="claimId" value={claim.id} />
      <textarea
        name="reviewNote"
        rows={2}
        maxLength={500}
        placeholder="審査メモ（任意）"
        className="w-full rounded-[8px] border border-line bg-white px-3 py-2 text-xs font-medium leading-relaxed text-ink outline-none focus:border-blush"
      />
      <div className="grid grid-cols-2 gap-2">
        <button
          name="decision"
          value="approve"
          className="inline-flex h-10 items-center justify-center gap-1 rounded-[8px] bg-ink px-3 text-xs font-black text-white"
        >
          <CheckCircle2 aria-hidden="true" size={15} />
          承認
        </button>
        <button
          name="decision"
          value="reject"
          className="inline-flex h-10 items-center justify-center gap-1 rounded-[8px] border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700"
        >
          <XCircle aria-hidden="true" size={15} />
          却下
        </button>
      </div>
    </form>
  );
}

function ClaimsTable({ claims }: { claims: AdminBarberShopClaim[] }) {
  if (claims.length === 0) {
    return <p className="rounded-[8px] border border-line bg-neutral-50 p-4 text-sm font-medium text-mute">確認待ちの店舗管理申請はありません。</p>;
  }

  return (
    <div className="overflow-x-auto rounded-[8px] border border-line bg-white shadow-sm">
      <table className="min-w-[1380px] text-left text-xs">
        <thead className="border-b border-line bg-neutral-50 text-mute">
          <tr>
            <th className="px-3 py-2 font-black">申請日時</th>
            <th className="px-3 py-2 font-black">店舗名</th>
            <th className="px-3 py-2 font-black">都道府県</th>
            <th className="px-3 py-2 font-black">市区町村</th>
            <th className="px-3 py-2 font-black">住所</th>
            <th className="px-3 py-2 font-black">電話番号</th>
            <th className="px-3 py-2 font-black">掲載元</th>
            <th className="px-3 py-2 font-black">申請者表示名</th>
            <th className="px-3 py-2 font-black">申請者メールアドレス</th>
            <th className="px-3 py-2 font-black">プロフィール区分</th>
            <th className="px-3 py-2 font-black">補足メッセージ</th>
            <th className="px-3 py-2 font-black">状態</th>
            <th className="px-3 py-2 font-black">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {claims.map((claim) => (
            <tr key={claim.id} className="align-top">
              <td className="whitespace-nowrap px-3 py-3 font-bold text-mute">{dateLabel(claim.createdAt)}</td>
              <td className="max-w-[13rem] px-3 py-3">
                {claim.shop ? (
                  <Link href={`/stores/${claim.shop.id}`} className="inline-flex items-center gap-1 font-black text-blush">
                    {claim.shop.name}
                    <ExternalLink aria-hidden="true" size={12} />
                  </Link>
                ) : (
                  <span className="font-black text-red-700">店舗未取得</span>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-3 font-semibold text-ink">{textOrUnset(claim.shop?.prefecture)}</td>
              <td className="whitespace-nowrap px-3 py-3 font-semibold text-ink">{textOrUnset(claim.shop?.municipality)}</td>
              <td className="max-w-[18rem] px-3 py-3 font-medium leading-relaxed text-ink">{textOrUnset(claim.shop?.address)}</td>
              <td className="whitespace-nowrap px-3 py-3 font-semibold text-ink">{textOrUnset(claim.shop?.phone)}</td>
              <td className="max-w-[12rem] px-3 py-3 font-medium leading-relaxed text-ink">{sourceLabel(claim.shop?.source)}</td>
              <td className="max-w-[12rem] px-3 py-3 font-black text-ink">{claim.applicantDisplayName}</td>
              <td className="max-w-[16rem] break-all px-3 py-3 font-semibold text-ink">{claim.applicantEmail}</td>
              <td className="whitespace-nowrap px-3 py-3 font-semibold text-ink">{claim.applicantJobTypeLabel}</td>
              <td className="max-w-[18rem] whitespace-pre-wrap px-3 py-3 font-medium leading-relaxed text-ink">{textOrUnset(claim.message)}</td>
              <td className="whitespace-nowrap px-3 py-3">
                <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[0.66rem] font-black text-amber-700">
                  {statusLabel(claim.status)}
                </span>
              </td>
              <td className="px-3 py-3">
                <ClaimReviewForm claim={claim} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function BarberShopClaimsAdminPage({ searchParams }: ClaimsPageProps) {
  await requireBarberHubAdmin();
  const params = await searchParams;
  const config = getSupabaseAdminConfigStatus();

  if (!config.ready) {
    return <ConfigPanel missing={config.missing} />;
  }

  const { claims, error } = await listPendingBarberShopClaimsForAdmin(createSupabaseAdminClient());

  return (
    <main className="mx-auto min-h-screen max-w-[1180px] bg-white px-4 py-6 text-ink">
      <header className="flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blushSoft px-3 py-1 text-xs font-black text-blush">
            <ShieldCheck aria-hidden="true" size={15} />
            非公開管理画面
          </div>
          <h1 className="mt-3 text-2xl font-black leading-tight">店舗管理申請の審査</h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
            確認待ちの申請だけを表示します。承認すると店舗が申請者アカウントに紐づき、店舗機能を利用できます。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/barber-shops/import" className="inline-flex h-10 items-center justify-center rounded-[8px] border border-line bg-white px-3 text-xs font-black text-ink">
            CSV取込へ
          </Link>
          <Link href="/" className="inline-flex h-10 items-center justify-center rounded-[8px] border border-line bg-white px-3 text-xs font-black text-ink">
            BARBER HUBへ戻る
          </Link>
        </div>
      </header>

      <section className="mt-4 grid gap-3">
        {params.error ? <Banner type="error" message={params.error} /> : null}
        {params.approved ? <Banner type="success" message="店舗管理申請を承認しました。" /> : null}
        {params.rejected ? <Banner type="success" message="店舗管理申請を却下しました。" /> : null}
        {error ? <Banner type="error" message="店舗管理申請を取得できませんでした。migration適用状況を確認してください。" /> : null}
      </section>

      <section className="mt-5 grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-black text-ink">確認待ち申請</h2>
          <span className="rounded-full border border-line bg-neutral-50 px-3 py-1 text-xs font-black text-mute">{claims.length.toLocaleString("ja-JP")}件</span>
        </div>
        <ClaimsTable claims={claims} />
      </section>
    </main>
  );
}
