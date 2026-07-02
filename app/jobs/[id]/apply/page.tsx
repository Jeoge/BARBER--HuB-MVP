import { CheckCircle2, Send } from "lucide-react";
import Link from "next/link";
import { PageChrome } from "@/components/PageChrome";
import { findJobListing } from "@/lib/jobs";

const positions = ["理容専門学生", "アシスタント", "スタイリスト", "ブランクあり", "転職検討中", "その他"];

export default async function JobApplyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = await params;
  const { type } = await searchParams;
  const job = findJobListing(id);
  const applicationType = type === "interview" ? "面接" : "見学";

  if (job == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-8">
          <h1 className="text-2xl font-black text-ink">求人が見つかりません</h1>
          <Link href="/jobs" className="mt-5 inline-flex h-11 items-center justify-center rounded-[8px] bg-blush px-4 text-sm font-black text-white">
            求人一覧へ戻る
          </Link>
        </section>
      </PageChrome>
    );
  }

  return (
    <PageChrome>
      <section className="px-4 pt-5">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-blush">JOB APPLY</p>
        <h1 className="mt-1 text-[1.55rem] font-black leading-tight text-ink">{applicationType}を申し込む</h1>
        <p className="mt-2 text-[0.86rem] font-medium leading-relaxed text-mute">
          {job.salonName}への{applicationType}申込です。MVPでは送信後の仮完了表示のみ行います。
        </p>
      </section>

      <section className="grid gap-4 px-4 pt-5">
        <Input label="名前" placeholder="例：山田 太郎" />
        <Input label="年齢" placeholder="例：22" />
        <Input label="連絡先" placeholder="メールアドレスまたは電話番号" />

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">現在の立場</span>
          <select className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush">
            {positions.map((position) => (
              <option key={position}>{position}</option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <Input label="アシスタント歴" placeholder="例：1年" />
          <Input label="スタイリスト歴" placeholder="例：3年" />
        </div>

        <Input label={`希望内容（${applicationType}）`} placeholder={`${applicationType}で相談したいこと`} />
        <Input label="希望勤務エリア" placeholder="例：福岡市内、通勤30分以内" />
        <Input label={`${applicationType}希望日`} placeholder="例：平日の午前、来週火曜など" />

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">自由記入欄</span>
          <textarea
            rows={5}
            className="resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush"
            placeholder="質問したいこと、働き方の希望、不安なことなど"
          />
        </label>

        <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-3">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <CheckCircle2 aria-hidden="true" size={18} className="text-blush" />
            MVP用の仮送信
          </div>
          <p className="mt-2 text-[0.78rem] font-medium leading-relaxed text-mute">
            送信後は「申込内容を受け付けました」と表示します。実装時にはサロンへ通知されます。
          </p>
        </div>

        <button className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-blush text-sm font-black text-white">
          <Send aria-hidden="true" size={17} />
          申込内容を送信する
        </button>

        <div className="rounded-[8px] bg-neutral-50 p-3 text-center">
          <p className="text-sm font-black text-ink">申込内容を受け付けました</p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-mute">
            これはMVP用の仮完了表示です。
          </p>
        </div>
      </section>
    </PageChrome>
  );
}

function Input({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-ink">{label}</span>
      <input
        className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-bold text-ink outline-none focus:border-blush"
        placeholder={placeholder}
      />
    </label>
  );
}
