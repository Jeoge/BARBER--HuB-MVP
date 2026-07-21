import { AlertTriangle, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { requireBarberHubAdmin } from "@/lib/admin/permissions";
import { listPartnerInquiriesForAdmin, type PartnerInquiryListItem, type PartnerInquiryStatus } from "@/lib/admin/partner-inquiries";
import { createSupabaseAdminClient, getSupabaseAdminConfigStatus } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PartnerInquiriesPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

const statusLabels: Record<PartnerInquiryStatus, string> = {
  new: "新規",
  in_progress: "対応中",
  replied: "返信済み",
  closed: "完了",
  spam: "スパム",
};

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未設定" : new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function textOrUnset(value: string | null) {
  return value?.trim() || "未設定";
}

function messageExcerpt(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > 72 ? `${compact.slice(0, 72)}…` : compact;
}

function statusClass(status: PartnerInquiryStatus) {
  if (status === "spam") return "border-red-200 bg-red-50 text-red-700";
  if (status === "closed" || status === "replied") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "in_progress") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function ConfigPanel({ missing }: { missing: string[] }) {
  return (
    <main className="mx-auto min-h-screen max-w-[860px] bg-white px-4 py-8 text-ink">
      <section className="rounded-[8px] border border-line bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle aria-hidden="true" size={20} className="text-blush" />
          <h1 className="text-lg font-black">問い合わせ管理画面の設定が不足しています</h1>
        </div>
        <p className="mt-3 text-sm font-medium leading-relaxed text-mute">次のサーバー専用環境変数を設定してください。値は画面やログには表示しません。</p>
        <ul className="mt-4 grid gap-2">
          {missing.map((name) => <li key={name} className="rounded-[8px] border border-line bg-neutral-50 px-3 py-2 text-sm font-bold">{name}</li>)}
        </ul>
      </section>
    </main>
  );
}

function InquiryTable({ inquiries }: { inquiries: PartnerInquiryListItem[] }) {
  if (inquiries.length === 0) {
    return <p className="rounded-[8px] border border-line bg-neutral-50 p-4 text-sm font-medium text-mute">問い合わせはまだありません。</p>;
  }

  return (
    <div className="overflow-x-auto rounded-[8px] border border-line bg-white shadow-sm">
      <table className="min-w-[900px] text-left text-xs">
        <thead className="border-b border-line bg-neutral-50 text-mute">
          <tr>
            <th className="px-3 py-2 font-black">受付日時</th>
            <th className="px-3 py-2 font-black">お名前</th>
            <th className="px-3 py-2 font-black">会社名・団体名</th>
            <th className="px-3 py-2 font-black">問い合わせ種別</th>
            <th className="px-3 py-2 font-black">ステータス</th>
            <th className="px-3 py-2 font-black">メールアドレス</th>
            <th className="px-3 py-2 font-black">本文抜粋</th>
            <th className="px-3 py-2 font-black">詳細</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {inquiries.map((inquiry) => (
            <tr key={inquiry.id} className="align-top">
              <td className="whitespace-nowrap px-3 py-3 font-bold text-mute">{dateLabel(inquiry.created_at)}</td>
              <td className="max-w-[10rem] px-3 py-3 font-black text-ink">{inquiry.contact_name}</td>
              <td className="max-w-[12rem] px-3 py-3 font-medium text-ink">{textOrUnset(inquiry.organization_name)}</td>
              <td className="max-w-[13rem] px-3 py-3 font-medium text-ink">{textOrUnset(inquiry.inquiry_type)}</td>
              <td className="whitespace-nowrap px-3 py-3"><span className={`inline-flex rounded-full border px-2 py-1 text-[0.66rem] font-black ${statusClass(inquiry.status)}`}>{statusLabels[inquiry.status]}</span></td>
              <td className="max-w-[16rem] break-all px-3 py-3 font-semibold text-ink">{inquiry.email}</td>
              <td className="max-w-[18rem] px-3 py-3 font-medium leading-relaxed text-mute">{messageExcerpt(inquiry.message)}</td>
              <td className="px-3 py-3"><Link href={`/admin/partner-inquiries/${inquiry.id}`} className="inline-flex min-h-10 items-center gap-1 rounded-[8px] border border-line bg-white px-3 font-black text-ink hover:border-blush/40"><ExternalLink aria-hidden="true" size={13} />確認</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function PartnerInquiriesAdminPage({ searchParams }: PartnerInquiriesPageProps) {
  await requireBarberHubAdmin();
  const params = searchParams ? await searchParams : {};
  const config = getSupabaseAdminConfigStatus();

  if (!config.ready) return <ConfigPanel missing={config.missing} />;

  const { inquiries, error } = await listPartnerInquiriesForAdmin(createSupabaseAdminClient());

  return (
    <main className="mx-auto min-h-screen max-w-[1280px] bg-white px-4 py-6 text-ink">
      <header className="flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blushSoft px-3 py-1 text-xs font-black text-blush"><ShieldCheck aria-hidden="true" size={15} />非公開管理画面</div>
          <h1 className="mt-3 text-2xl font-black leading-tight">PARTNERS問い合わせ</h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">問い合わせ内容は管理者だけが確認できます。一覧では本文を短く抜粋しています。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/partners" className="inline-flex h-10 items-center justify-center rounded-[8px] border border-line bg-white px-3 text-xs font-black text-ink">PARTNERSページへ</Link>
          <Link href="/" className="inline-flex h-10 items-center justify-center rounded-[8px] border border-line bg-white px-3 text-xs font-black text-ink">BARBER HUBへ戻る</Link>
        </div>
      </header>
      {params.error ? <p className="mt-4 rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black text-red-700" role="alert">{params.error}</p> : null}
      {error ? <p className="mt-4 rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black text-red-700" role="alert">問い合わせを取得できませんでした。migration適用状況を確認してください。</p> : null}
      <section className="mt-5 grid gap-3">
        <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-black">受け付けた問い合わせ</h2><span className="rounded-full border border-line bg-neutral-50 px-3 py-1 text-xs font-black text-mute">{inquiries.length.toLocaleString("ja-JP")}件</span></div>
        <InquiryTable inquiries={inquiries} />
      </section>
    </main>
  );
}
