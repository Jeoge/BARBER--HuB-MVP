import { Award, BadgeCheck, Gift, Star } from "lucide-react";

const contributionCards = [
  {
    title: "Thanksが貯まる",
    body: "投稿や回答が役に立つとThanksが届く。",
    icon: Star,
  },
  {
    title: "マイページで確認",
    body: "Thanksや投稿の積み重ねを、本人だけが確認できる。",
    icon: BadgeCheck,
  },
  {
    title: "バッジ獲得",
    body: "あなたやあなたのお店の信頼度up 特集記事も組める",
    icon: Award,
  },
  {
    title: "編集部セレクト",
    body: "現場やカテゴリにあった役立つ経験として紹介させていただきます",
    icon: BadgeCheck,
  },
  {
    title: "将来の特典",
    body: "講習会割引、メーカー商品、掲載優遇、スポンサー特典などに交換できる想定。",
    stat: "特典準備中",
    icon: Gift,
  },
];

export function ContributionSection() {
  return (
    <section className="px-4 pt-4">
      <div className="rounded-[8px] border border-line/80 bg-white p-2 shadow-[0_8px_22px_rgba(17,17,17,0.035)]">
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">
          Contribution
        </p>
        <h2 className="mt-0.5 text-[1.05rem] font-black leading-tight text-ink">
          経験を未来に残そう
        </h2>
        <p className="mt-0.5 text-[0.8rem] font-medium leading-snug text-mute">
          繋がれば　もっと面白い
        </p>

        <div className="no-scrollbar mt-1.5 flex items-start gap-3 overflow-x-auto pb-0.5">
          {contributionCards.map(({ title, body, stat, icon: Icon }) => (
            <article
              key={title}
              className="w-[68%] shrink-0 rounded-[8px] border border-line/80 bg-white p-2"
            >
              <div className="mb-1.5 grid h-6 w-6 place-items-center rounded-full bg-neutral-50 text-blush">
                <Icon aria-hidden="true" size={15} />
              </div>
              <h3 className="text-sm font-black text-ink">{title}</h3>
              <p className="mt-1 line-clamp-2 text-[0.72rem] font-medium leading-snug text-mute">
                {body}
              </p>
              {stat ? (
                <p className="mt-1 text-[0.72rem] font-semibold text-ink">
                  {stat}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
