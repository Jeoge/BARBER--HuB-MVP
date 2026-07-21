import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { requireBarberHubAdmin } from "@/lib/admin/permissions";
import { getPartnerInquiryForAdmin, PARTNER_INQUIRY_STATUSES, type PartnerInquiryStatus } from "@/lib/admin/partner-inquiries";
import { createSupabaseAdminClient, getSupabaseAdminConfigStatus } from "@/lib/supabase/admin";
import { updatePartnerInquiryAction } from "../actions";

export const dynamic = "force-dynamic";

type PartnerInquiryDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ updated?: string }>;
};

const statusLabels: Record<PartnerInquiryStatus, string> = {
  new: "新規",
  in_progress: "対応中",
  replied: "返信済み",
  closed: "完了",
  spam: "スパム",
};

function dateLabel(value: string | null) {
  if (!value) return "未設定";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未設定" : new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function safeMailto(email: string) {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("BARBER HUBへのお問い合わせについて")}`;
}

function safeTel(phone: string) {
  const value = phone.replace(/[^0-9+*#(),;.pw -]/gi, "");
  return value ? `tel:${value}` : null;
}

function safeWebsite(value: string | null) {
  if (!value || value.length > 500) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid gap-1"><dt className="text-[0.68rem] font-black uppercase tracking-[0.08em] text-mute">{label}</dt><dd className="break-words text-sm font-semibold leading-relaxed text-ink">{children}</dd></div>;
}

function ConfigPanel({ missing }: { missing: string[] }) {
  return <main className="mx-auto min-h-screen max-w-[860px] bg-white px-4 py-8 text-ink"><section className="rounded-[8px] border border-line bg-white p-5 shadow-sm"><h1 className="text-lg font-black">問い合わせ詳細の設定が不足しています</h1><p className="mt-3 text-sm font-medium text-mute">サーバー専用のSupabase環境変数を設定してください。</p><ul className="mt-4 grid gap-2">{missing.map((name) => <li key={name} className="rounded-[8px] border border-line bg-neutral-50 px-3 py-2 text-sm font-bold">{name}</li>)}</ul></section></main>;
}

export default async function PartnerInquiryDetailPage({ params, searchParams }: PartnerInquiryDetailPageProps) {
  const admin = await requireBarberHubAdmin();
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const config = getSupabaseAdminConfigStatus();

  if (!config.ready) return <ConfigPanel missing={config.missing} />;
  const { inquiry, error } = await getPartnerInquiryForAdmin(createSupabaseAdminClient(), id);

  if (error || !inquiry) {
    return <main className="mx-auto min-h-screen max-w-[860px] bg-white px-4 py-8 text-ink"><p className="rounded-[8px] border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">問い合わせを取得できませんでした。</p><Link href="/admin/partner-inquiries" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[8px] border border-line px-4 text-sm font-black"><ArrowLeft aria-hidden="true" size={16} />一覧へ戻る</Link></main>;
  }

  const websiteUrl = safeWebsite(inquiry.website_url);
  const phoneHref = inquiry.phone ? safeTel(inquiry.phone) : null;

  return (
    <main className="mx-auto min-h-screen max-w-[860px] bg-white px-4 py-6 pb-16 text-ink">
      <header className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="inline-flex items-center gap-2 rounded-full bg-blushSoft px-3 py-1 text-xs font-black text-blush"><ShieldCheck aria-hidden="true" size={15} />非公開管理画面</div><h1 className="mt-3 text-2xl font-black leading-tight">問い合わせ詳細</h1><p className="mt-2 text-sm font-medium text-mute">受付日時：{dateLabel(inquiry.created_at)}</p></div>
        <Link href="/admin/partner-inquiries" className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-line px-3 text-xs font-black"><ArrowLeft aria-hidden="true" size={15} />一覧へ戻る</Link>
      </header>

      {query.updated === "1" ? <p className="mt-4 rounded-[8px] border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-700" role="status">問い合わせを更新しました。</p> : null}

      <section className="mt-5 rounded-[9px] border border-line bg-white p-4 shadow-sm">
        <h2 className="text-base font-black">受付内容</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="受付日時">{dateLabel(inquiry.created_at)}</Field>
          <Field label="お名前">{inquiry.contact_name}</Field>
          <Field label="会社名・団体名">{inquiry.organization_name || "未設定"}</Field>
          <Field label="メールアドレス"><a href={safeMailto(inquiry.email)} className="break-all text-blush underline underline-offset-2">{inquiry.email}</a></Field>
          <Field label="電話番号">{inquiry.phone ? (phoneHref ? <a href={phoneHref} className="text-blush underline underline-offset-2">{inquiry.phone}</a> : inquiry.phone) : "未設定"}</Field>
          <Field label="WebサイトURL">{websiteUrl ? <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 break-all text-blush underline underline-offset-2">{websiteUrl}<ExternalLink aria-hidden="true" size={13} /></a> : "未設定"}</Field>
          <Field label="問い合わせ種別">{inquiry.inquiry_type || "未設定"}</Field>
          <Field label="対応日時">{dateLabel(inquiry.reviewed_at)}</Field>
        </dl>
        <div className="mt-5 border-t border-line pt-4"><dt className="text-[0.68rem] font-black uppercase tracking-[0.08em] text-mute">お問い合わせ内容</dt><dd className="mt-2 whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-ink">{inquiry.message}</dd></div>
      </section>

      <section className="mt-4 rounded-[9px] border border-line bg-neutral-50 p-4">
        <h2 className="text-base font-black">対応状況</h2>
        <form action={updatePartnerInquiryAction} className="mt-4 grid gap-4">
          <input type="hidden" name="inquiryId" value={inquiry.id} />
          <label className="grid gap-2"><span className="text-sm font-black">ステータス</span><select name="status" defaultValue={inquiry.status} className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-black outline-none focus:border-blush">{PARTNER_INQUIRY_STATUSES.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label>
          <label className="grid gap-2"><span className="text-sm font-black">管理者メモ</span><textarea name="adminNote" defaultValue={inquiry.admin_note ?? ""} maxLength={5000} rows={5} className="resize-y rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed outline-none focus:border-blush" /></label>
          <button type="submit" className="inline-flex min-h-12 items-center justify-center rounded-[8px] bg-ink px-4 text-sm font-black text-white">ステータス・メモを保存</button>
        </form>
        <p className="mt-3 text-xs font-medium leading-relaxed text-mute">保存時に対応日時と対応した管理者を記録します。問い合わせの物理削除は行いません。</p>
      </section>

      <p className="mt-4 text-xs font-medium text-mute">受付元：{inquiry.source_page} / 対応者ID：{inquiry.reviewed_by || "未設定"} / 現在の管理者：{admin.id}</p>
    </main>
  );
}
