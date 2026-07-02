import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";

const attributeTags = [
  "一人営業",
  "オーナー",
  "スタッフ",
  "理容学生",
  "開業準備中",
  "2代目",
  "地方サロン",
  "都市部サロン",
  "メンズ特化",
  "顔剃りあり",
  "経営に悩み中",
  "技術に悩み中",
];

export default function BackyardSetupPage() {
  return (
    <PageChrome>
      <section className="px-4 pt-4">
        <Link href="/backyard" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
          <ArrowLeft aria-hidden="true" size={17} />
          戻る
        </Link>
      </section>

      <PageHeaderBlock
        eyebrow="BACK ROOM SETUP"
        title="Back Room設定"
        body="Back Roomでは、表プロフィールとは別のニックネームで参加できます。"
      />

      <section className="grid gap-4 px-4 pt-4">
        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">Back Room用ニックネーム</span>
          <input
            className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-bold text-ink outline-none focus:border-blush"
            placeholder="例：営業後の理容師"
          />
        </label>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-black text-ink">属性タグ</legend>
          <div className="flex flex-wrap gap-2">
            {attributeTags.map((tag, index) => (
              <label
                key={tag}
                className={
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black " +
                  (index < 2 ? "bg-blush text-white" : "border border-line bg-white text-ink")
                }
              >
                <input type="checkbox" defaultChecked={index < 2} className="h-3.5 w-3.5 accent-blush" />
                {tag}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-3">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <ShieldCheck aria-hidden="true" size={18} className="text-blush" />
            注意
          </div>
          <p className="mt-1.5 text-xs font-medium leading-relaxed text-mute">
            個人名・店舗名を出した攻撃や晒しは禁止です。
            店名や本名を出さずに話せますが、荒れる場所にはしません。
          </p>
        </div>

        <Link href="/backyard" className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-blush text-sm font-black text-white">
          <CheckCircle2 aria-hidden="true" size={18} />
          設定後にBack Roomへ進む
        </Link>
      </section>
    </PageChrome>
  );
}
