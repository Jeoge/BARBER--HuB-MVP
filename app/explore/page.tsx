import { Briefcase, Building2, GraduationCap, MessageSquare, PackageOpen, Search, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import Link from "next/link";
import { AuthGateLink } from "@/components/AuthGate";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";

const categories = [
  { label: "技術", icon: Wrench, href: "/explore?category=tech" },
  { label: "経営", icon: Briefcase, href: "/explore?category=business" },
  { label: "集客", icon: Sparkles, href: "/explore?category=marketing" },
  { label: "AI", icon: Sparkles, href: "/explore?category=ai" },
  { label: "道具", icon: Wrench, href: "/explore?category=tools" },
  { label: "メーカー情報", icon: PackageOpen, href: "/partners" },
  { label: "求人", icon: Briefcase, href: "/jobs" },
  { label: "開業・承継", icon: Building2, href: "/salon-transition" },
  { label: "講習会", icon: GraduationCap, href: "/seminars" },
  { label: "Q&A", icon: MessageSquare, href: "/qa" },
];

const popular = [
  "フェードのつなぎ方",
  "Google口コミを増やす",
  "価格改定の伝え方",
  "静音バリカン比較",
  "AI投稿カレンダー",
];

export default function ExplorePage() {
  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="EXPLORE"
        title="探す"
        body="記事、Q&A、講習会、求人、メーカー情報をまとめて探せる入口です。"
      />
      <section className="px-4 pt-4">
        <label className="flex h-12 items-center gap-2 rounded-[8px] border border-line bg-neutral-50 px-3">
          <Search aria-hidden="true" size={18} className="text-blush" />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-ink outline-none placeholder:text-mute"
            placeholder="キーワードで探す"
          />
        </label>
      </section>
      <section className="px-4 pt-5">
        <h2 className="text-base font-black text-ink">人気カテゴリ</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {categories.map(({ label, href, icon: Icon }) => (
            <Link key={label} href={href} className="flex items-center gap-2 rounded-[8px] border border-line bg-white p-3 shadow-sm">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-blushSoft text-blush">
                <Icon aria-hidden="true" size={18} />
              </span>
              <span className="text-sm font-black text-ink">{label}</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="px-4 pt-5">
        <h2 className="text-base font-black text-ink">よく探されていること</h2>
        <div className="mt-3 no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {popular.map((item) => (
            <button key={item} className="shrink-0 rounded-full border border-line bg-white px-3 py-2 text-xs font-black text-ink">
              {item}
            </button>
          ))}
        </div>
      </section>
      <section className="px-4 pt-5">
        <AuthGateLink href="/backyard/setup" kind="backyard" className="flex w-full items-center gap-3 rounded-[8px] border border-blush/20 bg-blushSoft p-4 text-left">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-blush">
            <ShieldCheck aria-hidden="true" size={20} />
          </span>
          <span>
            <span className="block text-sm font-black text-ink">Back Room入口</span>
            <span className="mt-0.5 block text-xs font-bold text-mute">理容師を中心に、理美容業界の人が話せる営業後コミュニティ</span>
          </span>
        </AuthGateLink>
      </section>
    </PageChrome>
  );
}
