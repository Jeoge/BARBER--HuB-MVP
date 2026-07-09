import { Send, ShieldAlert } from "lucide-react";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { createSupportInquiryAction } from "@/lib/actions/support";

type ContactPageProps = {
  searchParams?: Promise<{ error?: string; sent?: string; topic?: string }>;
};

const inquiryTypes = [
  { value: "general", label: "一般お問い合わせ" },
  { value: "advertising", label: "広告・協賛について" },
  { value: "jobs", label: "求人掲載について" },
  { value: "succession", label: "開業・承継について" },
  { value: "report", label: "投稿の通報" },
  { value: "rights", label: "権利侵害・削除依頼" },
  { value: "bug", label: "不具合報告" },
  { value: "other", label: "その他" },
];

function defaultType(topic?: string) {
  if (topic?.includes("job")) return "jobs";
  if (topic?.includes("succession")) return "succession";
  if (topic?.includes("ad")) return "advertising";
  return "general";
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;

  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="CONTACT"
        title="通報・お問い合わせ"
        body="投稿の通報、権利侵害、広告・求人・開業承継に関する相談、その他のお問い合わせを受け付けます。"
      />

      <form action={createSupportInquiryAction} className="grid gap-4 px-4 pt-5">
        <input type="hidden" name="redirectTo" value="/contact" />
        {params?.sent === "1" ? (
          <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-sm font-black leading-relaxed text-ink">
            送信しました。内容を確認後、必要に応じて運営から連絡します。
          </div>
        ) : null}
        {params?.error ? (
          <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
            {params.error}
          </div>
        ) : null}

        <div className="rounded-[8px] border border-line bg-white p-3">
          <div className="flex items-start gap-2">
            <ShieldAlert aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-blush" />
            <p className="text-[0.78rem] font-bold leading-relaxed text-mute">
              通報や削除依頼では、対象URLと理由をできるだけ具体的に書いてください。必要な範囲で確認します。
            </p>
          </div>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">名前 *</span>
          <input name="name" required className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush" placeholder="例：山田 太郎" />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">メールアドレス *</span>
          <input name="email" type="email" required className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush" placeholder="example@barberhub.jp" />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">問い合わせ種別 *</span>
          <select name="inquiryType" required defaultValue={defaultType(params?.topic)} className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush">
            {inquiryTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">対象URL</span>
          <input name="targetUrl" type="text" className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush" placeholder="/posts/... または https://..." />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">内容 *</span>
          <textarea name="message" required rows={7} maxLength={3000} className="resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush" placeholder="お問い合わせ内容、通報理由、確認してほしい内容を書いてください。" />
        </label>

        <label className="flex items-start gap-2 rounded-[8px] border border-line bg-neutral-50 p-3">
          <input name="confirmed" type="checkbox" required className="mt-1 h-4 w-4 accent-blush" />
          <span className="text-xs font-bold leading-relaxed text-mute">
            入力内容を確認し、運営から連絡する場合があることを理解しました。
          </span>
        </label>

        <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-blush text-sm font-black text-white">
          <Send aria-hidden="true" size={17} />
          送信する
        </button>
      </form>
    </PageChrome>
  );
}
