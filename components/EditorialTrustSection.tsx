import { CheckCircle2, Layers3 } from "lucide-react";

const sourceSteps = [
  {
    label: "運営記事",
    body: "BARBER HUB編集部が取材・整理して、毎朝読みやすい形で届けます。",
  },
  {
    label: "編集部投稿",
    body: "投稿が少ない初期も、編集部が業界の動きを集めて表紙を更新します。",
  },
  {
    label: "匿名協力サロン",
    body: "協力サロンの声は、本人が特定されない範囲で誠実に表記します。",
  },
  {
    label: "支部レポート",
    body: "地域の講習会・コンクール・求人の動きを、支部単位で集めます。",
  },
  {
    label: "実ユーザー投稿",
    body: "会員の投稿が増えたら、AI編集部が学びとして整理していきます。",
  },
];

export function EditorialTrustSection() {
  return (
    <section className="px-4 pt-5">
      <div className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blushSoft text-blush">
            <Layers3 aria-hidden="true" size={19} />
          </div>
          <div>
            <p className="text-[0.67rem] font-black uppercase tracking-[0.12em] text-blush">
              EDITORIAL POLICY
            </p>
            <h2 className="mt-1 text-[1rem] font-black leading-tight text-ink">
              初期コンテンツは「偽装」ではなく「編集」です
            </h2>
            <p className="mt-2 text-[0.78rem] font-medium leading-relaxed text-mute">
              BARBER HUB編集部が情報を集め、整理し、理容師が読みやすい形に変えます。信頼を守るため、投稿者表記は誠実に行います。
            </p>
          </div>
        </div>

        <div className="mt-3 no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {sourceSteps.map((step, index) => (
            <article
              key={step.label}
              className="w-[72%] shrink-0 rounded-[8px] border border-line bg-neutral-50 p-3"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[0.7rem] font-black text-blush">
                  {index + 1}
                </span>
                <h3 className="text-[0.82rem] font-black text-ink">{step.label}</h3>
              </div>
              <p className="mt-2 text-[0.72rem] font-medium leading-relaxed text-mute">
                {step.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-[8px] bg-blushSoft px-3 py-2 text-[0.72rem] font-black text-ink">
          <CheckCircle2 aria-hidden="true" size={16} className="shrink-0 text-blush" />
          運営記事、編集部投稿、匿名協力サロン、支部レポート、実ユーザー投稿の順に育てます。
        </div>
      </div>
    </section>
  );
}
