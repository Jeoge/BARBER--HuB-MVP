import { Award, BadgeCheck, Gift, Star, Trophy } from "lucide-react";

const contributionCards = [
  {
    title: "THANKSが貯まる",
    body: "投稿や回答が役に立つとTHANKSが届く。",
    stat: "THANKS累計 12,458",
    icon: Star,
  },
  {
    title: "貢献ポイント",
    body: "THANKS・投稿数・回答数に応じてポイントが貯まる。",
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
    <section className="px-4 pt-6">
      <div className="rounded-[8px] border border-blush/20 bg-white p-4 shadow-sm">
        <p className="text-[0.7rem] font-black uppercase tracking-[0.14em] text-blush">
          Contribution
        </p>
        <h2 className="mt-1 text-lg font-black leading-tight text-ink">
          THANKSがあなたの信頼になる
        </h2>
        <div className="mt-2 grid gap-1.5 text-[0.8rem] font-bold leading-relaxed text-mute">
          <p>BARBER HUBでは、人気より貢献を評価します。</p>
          <p>あなたの経験が、誰かの役に立つほど信頼になります。</p>
          <p>THANKSは、いいねではなく感謝の証です。</p>
        </div>

        <div className="no-scrollbar mt-4 flex gap-2.5 overflow-x-auto pb-1">
          {contributionCards.map(({ title, body, stat, icon: Icon }) => (
            <article
              key={title}
              className="w-[72%] shrink-0 rounded-[8px] border border-blush/15 bg-blushSoft/40 p-3"
            >
              <div className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-white text-blush">
                <Icon aria-hidden="true" size={18} />
              </div>
              <h3 className="text-sm font-black text-ink">{title}</h3>
              <p className="mt-1 min-h-10 text-[0.76rem] font-medium leading-relaxed text-mute">
                {body}
              </p>
              <p className="mt-3 rounded-full bg-white px-3 py-1.5 text-[0.72rem] font-black text-ink">
                {stat}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
