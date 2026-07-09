import { ArrowLeft, Megaphone, Send } from "lucide-react";
import Link from "next/link";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { SafetyChecklistSubmit } from "@/components/SafetyChecklist";
import { ACCOUNT_TYPE_OPTIONS } from "@/lib/accountTypes";
import { pathWithParams } from "@/lib/auth/redirects";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";
import { createAdvertisingInquiryAction } from "../actions";

type AdvertisingApplyPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

const inquiryTypes = [
  "注目掲載",
  "上位表示",
  "編集部作成の紹介記事",
  "地域特集",
  "公式告知",
  "協賛掲載",
  "開業支援パートナー掲載",
  "その他相談",
];

const budgetRanges = ["未定", "無料掲載の範囲で相談", "3万円未満", "3〜10万円", "10〜30万円", "30万円以上"];
const advertisingSafetyItems = [
  {
    name: "advertisingTruthConfirmed",
    label: "掲載内容に虚偽・誇大表現はありません。",
  },
  {
    name: "advertisingLabelConfirmed",
    label: "PR・広告・協賛表記が入ることを理解しています。",
  },
  {
    name: "advertisingNoGuaranteeConfirmed",
    label: "掲載効果が保証されるものではないことを理解しています。",
  },
];

function TextField({
  label,
  name,
  defaultValue,
  placeholder,
  required = false,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "email" | "url";
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-ink">
        {label}
        {required ? <span className="text-blush"> *</span> : null}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush"
      />
    </label>
  );
}

function TextAreaField({
  label,
  name,
  placeholder,
  required = false,
  rows = 5,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-ink">
        {label}
        {required ? <span className="text-blush"> *</span> : null}
      </span>
      <textarea
        name={name}
        rows={rows}
        required={required}
        placeholder={placeholder}
        className="resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush"
      />
    </label>
  );
}

function LoginRequiredCard() {
  return (
    <section className="px-4 pt-5">
      <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">LOGIN REQUIRED</p>
        <h2 className="mt-2 text-lg font-black leading-tight text-ink">問い合わせにはログインが必要です</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
          送信者を確認できる状態で、広告掲載・協賛の相談内容を保存します。
        </p>
        <Link href={pathWithParams("/login", { next: "/advertising/apply" })} className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink px-4 text-sm font-black text-white">
          ログインする
        </Link>
      </div>
    </section>
  );
}

export default async function AdvertisingApplyPage({ searchParams }: AdvertisingApplyPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
    return (
      <PageChrome>
        <PageHeaderBlock
          eyebrow="PR APPLY"
          title="広告掲載・協賛問い合わせ"
          body="掲載内容は運営確認後に個別相談で進めます。決済機能はまだありません。"
        />
        <LoginRequiredCard />
      </PageChrome>
    );
  }

  const { profile } = await getAccountProfile(supabase, user.id);

  return (
    <PageChrome>
      <section className="px-4 pt-4">
        <Link href="/advertising" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
          <ArrowLeft aria-hidden="true" size={17} />
          広告掲載へ戻る
        </Link>
      </section>
      <PageHeaderBlock
        eyebrow="PR APPLY"
        title="広告掲載・協賛問い合わせ"
        body="通常投稿では扱わない公式告知、商品紹介、学校案内、講習会告知、協賛掲載の相談を送信できます。"
      />

      <form action={createAdvertisingInquiryAction} className="grid gap-4 px-4 pt-4">
        {params?.error ? (
          <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
            {params.error}
          </div>
        ) : null}

        <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-3">
          <div className="flex items-start gap-2">
            <Megaphone aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-blush" />
            <p className="text-[0.78rem] font-black leading-relaxed text-ink">
              送信後、運営が内容を確認して連絡します。掲載可否、期間、料金は個別相談です。
            </p>
          </div>
        </div>

        <TextField name="organizationName" label="会社名・団体名" required placeholder="例：株式会社〇〇 / 〇〇理容学校" defaultValue={profile?.salon_name} />
        <TextField name="contactName" label="担当者名" required placeholder="例：山田 太郎" defaultValue={profile?.display_name} />
        <TextField name="email" label="メールアドレス" type="email" required placeholder="example@barberhub.jp" defaultValue={user.email} />

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">登録区分</span>
          <select
            name="accountType"
            defaultValue={profile?.job_type ?? ""}
            className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush"
          >
            <option value="">未設定</option>
            {ACCOUNT_TYPE_OPTIONS.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">
            問い合わせ種別 <span className="text-blush">*</span>
          </span>
          <select name="inquiryType" required className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush">
            <option value="">選択してください</option>
            {inquiryTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <TextAreaField name="contentSummary" label="掲載したい内容" required placeholder="告知したい商品・学校案内・講習会・協賛内容などを入力してください。" />
        <TextAreaField name="purpose" label="掲載目的" placeholder="誰に届けたいか、どんな反応を期待しているかを書いてください。" rows={4} />
        <TextField name="desiredTiming" label="希望時期" placeholder="例：2026年8月上旬 / 未定" />

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">予算感</span>
          <select name="budgetRange" defaultValue="未定" className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush">
            {budgetRanges.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
        </label>

        <TextField name="websiteUrl" label="公式サイトURL" type="url" placeholder="https://example.com" />
        <TextAreaField name="note" label="備考" placeholder="補足、相談したいこと、希望する見せ方など。" rows={4} />

        <SafetyChecklistSubmit
          title="広告・協賛問い合わせ前の確認"
          body="掲載内容は運営確認後に掲載します。広告・PR・協賛であることが分かる表記を行い、掲載による応募数・売上・集客効果を保証するものではありません。"
          items={advertisingSafetyItems}
          rulesHref="/advertising/policy"
          rulesLabel="広告・PRポリシー"
          pendingText="送信中..."
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-blush text-sm font-black text-white"
        >
          <Send aria-hidden="true" size={17} />
          問い合わせを送信
        </SafetyChecklistSubmit>
      </form>
    </PageChrome>
  );
}
