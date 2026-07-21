"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { createPartnerInquiryAction } from "./actions";

function FieldLabel({ children, optional = false }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <span className="text-sm font-black text-ink">
      {children} {optional ? <span className="font-bold text-mute">（任意）</span> : <span className="text-blush">（必須）</span>}
    </span>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center justify-center rounded-[8px] bg-blush px-4 text-sm font-black text-white">
      {pending ? "送信中..." : "問い合わせを送信"}
    </button>
  );
}

export function PartnerInquiryForm({ error }: { error?: string }) {
  return (
    <form action={createPartnerInquiryAction} className="mt-4" noValidate={false}>
      <PartnerInquiryFields error={error} />
    </form>
  );
}

function PartnerInquiryFields({ error }: { error?: string }) {
  const { pending } = useFormStatus();

  return (
    <fieldset disabled={pending} aria-busy={pending} className="grid gap-4 border-0 p-0">
      {error ? (
        <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
        <label>
          Webサイト
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="grid gap-2">
        <FieldLabel>お名前</FieldLabel>
        <input name="contactName" required maxLength={100} autoComplete="name" className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush" />
      </label>

      <label className="grid gap-2">
        <FieldLabel optional>会社名・団体名</FieldLabel>
        <input name="organizationName" maxLength={160} autoComplete="organization" className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush" />
      </label>

      <label className="grid gap-2">
        <FieldLabel>メールアドレス</FieldLabel>
        <input name="email" type="email" required maxLength={254} autoComplete="email" className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush" />
      </label>

      <label className="grid gap-2">
        <FieldLabel optional>WebサイトURL</FieldLabel>
        <input name="websiteUrl" type="url" maxLength={500} placeholder="https://example.com" autoComplete="url" className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush" />
      </label>

      <label className="grid gap-2">
        <FieldLabel optional>電話番号</FieldLabel>
        <input name="phone" type="tel" maxLength={50} autoComplete="tel" className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush" />
      </label>

      <label className="grid gap-2">
        <FieldLabel optional>お問い合わせ種別</FieldLabel>
        <select name="inquiryType" defaultValue="" className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush">
          <option value="">選択してください</option>
          <option value="協賛について">協賛について</option>
          <option value="広告掲載について">広告掲載について</option>
          <option value="タイアップ・共同企画について">タイアップ・共同企画について</option>
          <option value="その他">その他</option>
        </select>
      </label>

      <label className="grid gap-2">
        <FieldLabel>お問い合わせ内容</FieldLabel>
        <textarea name="message" required minLength={20} maxLength={5000} rows={8} className="resize-y rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush" placeholder="検討中の内容や目的をお知らせください。" />
        <span className="text-[0.68rem] font-medium text-mute">20〜5000文字</span>
      </label>

      <label className="flex items-start gap-2 rounded-[8px] border border-line bg-neutral-50 p-3">
        <input name="privacyConsent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-blush" />
        <span className="text-xs font-bold leading-relaxed text-mute">
          <Link href="/privacy" className="text-ink underline underline-offset-2">プライバシーポリシー</Link>を確認し、内容に同意します。（必須）
        </span>
      </label>

      <SubmitButton />
    </fieldset>
  );
}
