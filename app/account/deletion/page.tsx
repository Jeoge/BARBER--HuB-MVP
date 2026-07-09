import { Send, ShieldCheck } from "lucide-react";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { createSupportInquiryAction } from "@/lib/actions/support";

type AccountDeletionPageProps = {
  searchParams?: Promise<{ error?: string; sent?: string }>;
};

export default async function AccountDeletionPage({ searchParams }: AccountDeletionPageProps) {
  const params = await searchParams;

  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="ACCOUNT"
        title="退会・削除依頼"
        body="アカウント退会、投稿削除、個人情報削除の依頼を受け付けます。誤削除を防ぐため、運営確認後に対応します。"
      />

      <form action={createSupportInquiryAction} className="grid gap-4 px-4 pt-5">
        <input type="hidden" name="redirectTo" value="/account/deletion" />
        <input type="hidden" name="inquiryType" value="deletion_request" />

        {params?.sent === "1" ? (
          <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-sm font-black leading-relaxed text-ink">
            依頼を受け付けました。本人確認が必要な場合は、運営から連絡します。
          </div>
        ) : null}
        {params?.error ? (
          <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
            {params.error}
          </div>
        ) : null}

        <div className="rounded-[8px] border border-line bg-white p-3">
          <div className="flex items-start gap-2">
            <ShieldCheck aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-blush" />
            <p className="text-[0.78rem] font-bold leading-relaxed text-mute">
              すぐにアカウントを削除するフォームではありません。本人確認や対象確認を行ったうえで、運営が対応します。
            </p>
          </div>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">名前 *</span>
          <input name="name" required className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush" placeholder="例：山田 太郎" />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">登録メールアドレス *</span>
          <input name="email" type="email" required className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush" placeholder="example@barberhub.jp" />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">対象URL</span>
          <input name="targetUrl" type="text" className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush" placeholder="/profiles/... /posts/... など" />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">依頼内容・理由 *</span>
          <textarea name="message" required rows={7} maxLength={3000} className="resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush" placeholder="アカウント退会、投稿削除、個人情報削除など、希望内容と理由を書いてください。" />
        </label>

        <label className="flex items-start gap-2 rounded-[8px] border border-line bg-neutral-50 p-3">
          <input name="confirmed" type="checkbox" required className="mt-1 h-4 w-4 accent-blush" />
          <span className="text-xs font-bold leading-relaxed text-mute">
            本人確認が必要な場合があること、運営確認後に対応することを理解しました。
          </span>
        </label>

        <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-blush text-sm font-black text-white">
          <Send aria-hidden="true" size={17} />
          依頼を送信
        </button>
      </form>
    </PageChrome>
  );
}
