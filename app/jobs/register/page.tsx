import { Briefcase, Send } from "lucide-react";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";

const fields = [
  ["サロン名", "例：BARBER HUB SALON"],
  ["地域", "例：東京・渋谷"],
  ["募集職種", "例：理容師 / アシスタント"],
  ["雇用形態", "例：正社員 / 業務委託 / アルバイト"],
  ["給与", "例：月給25万円から"],
  ["店舗の特徴", "例：メンズ特化、フェードが多い、週休2日"],
];

export default function JobsRegisterPage() {
  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="JOB REGISTER"
        title="求人掲載をはじめる"
        body="BARBER HUBでは、理容業界に関心のある学生・理容師へ求人情報を届けられます。"
      />
      <section className="grid gap-4 px-4 pt-4">
        {fields.map(([label, placeholder]) => (
          <label key={label} className="grid gap-2">
            <span className="text-sm font-black text-ink">{label}</span>
            {label === "店舗の特徴" ? (
              <textarea
                rows={5}
                className="resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush"
                placeholder={placeholder}
              />
            ) : (
              <input
                className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-bold text-ink outline-none focus:border-blush"
                placeholder={placeholder}
              />
            )}
          </label>
        ))}

        <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-3">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <Briefcase aria-hidden="true" size={18} className="text-blush" />
            掲載前に編集部が内容を確認します
          </div>
          <p className="mt-2 text-[0.78rem] font-medium leading-relaxed text-mute">
            求人広告ではなく、サロンの空気や働き方が伝わる情報に整えて掲載します。
          </p>
        </div>

        <button className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-blush text-sm font-black text-white">
          <Send aria-hidden="true" size={17} />
          掲載問い合わせ
        </button>
      </section>
    </PageChrome>
  );
}
