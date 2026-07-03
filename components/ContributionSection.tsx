import { Award, BadgeCheck, Gift, Star, Trophy } from "lucide-react";

const contributionCards = [
  {
    title: "Thanksが貯まる",
    body: "投稿や回答が役に立つとThanksが届く。",
    stat: "Thanks累計 12,458",
    icon: Star,
  },
  {
    title: "貢献ポイント",
    body: "Thanks・投稿数・回答数に応じてポイントが貯まる。",
    stat: "貢献ポイント 3,240pt",
    icon: BadgeCheck,
  },
  {
    title: "バッジ獲得",
    body: "フェード、経営、AI、集客などの専門バッジを獲得できる。",
    stat: "フェード専門バッジ",
    icon: Award,
  },
  {
    title: "ランキング掲載",
    body: "今週のContributorとして紹介される。",
    stat: "今週のContributor候補",
    icon: Trophy,
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
    <section className="px-4 pt-9">
      <div className="rounded-[8px] border border-line/80 bg-white p-4 shadow-[0_8px_22px_rgba(17,17,17,0.035)]">
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">
          Contribution
        </p>
        <h2 className="mt-1 text-[1.05rem] font-black leading-tight text-ink">
          Thanksがあなたの信頼になる
        </h2>
        <p className="mt-2 text-[0.8rem] font-medium leading-relaxed text-mute">
          人気より、貢献を。
        </p>

        <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
          {contributionCards.map(({ title, body, stat, icon: Icon }) => (
            <article
              key={title}
              className="w-[68%] shrink-0 rounded-[8px] border border-line/80 bg-white p-3"
            >
              <div className="mb-3 grid h-8 w-8 place-items-center rounded-full bg-neutral-50 text-blush">
                <Icon aria-hidden="true" size={16} />
              </div>
              <h3 className="text-sm font-black text-ink">{title}</h3>
              <p className="mt-1 line-clamp-2 min-h-9 text-[0.74rem] font-medium leading-relaxed text-mute">
                {body}
              </p>
              <p className="mt-3 text-[0.72rem] font-semibold text-ink">
                {stat}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
