import { ArrowRight, Building2, CheckCircle2, Handshake, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import { MagazineImage } from "@/components/MagazineImage";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { SalonTransitionNotice } from "@/components/SalonTransitionNotice";
import {
  salonTransitionListings,
  salonTransitionPartners,
  transitionCategories,
  transitionMonetizationItems,
} from "@/lib/salon-transition";

const checklist = [
  "貸主・管理会社への確認",
  "宅建業者への物件確認",
  "保健所関連手続きの確認",
  "税務・法務・契約の専門家相談",
  "設備状態と受け渡し方法の確認",
  "顧客・屋号・スタッフ引き継ぎ範囲の整理",
];

function ListingCard({ listing }: { listing: (typeof salonTransitionListings)[number] }) {
  return (
    <article className="rounded-[10px] border border-line bg-white p-3 shadow-[0_10px_28px_rgba(17,17,17,0.04)]">
      <Link href={`/salon-transition/${listing.id}`} className="block">
        <MagazineImage src={listing.imageUrl} alt={listing.title} variant={listing.type === "equipment" ? "tool" : "news"} className="aspect-[16/8.5]" />
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-blushSoft px-2.5 py-1 text-[0.62rem] font-black text-blush">{listing.typeLabel}</span>
          <span className="rounded-full border border-line bg-neutral-50 px-2.5 py-1 text-[0.62rem] font-black text-mute">{listing.status}</span>
          {listing.isAnonymous ? (
            <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[0.62rem] font-black text-mute">匿名掲載</span>
          ) : null}
        </div>
        <h2 className="mt-2 text-base font-black leading-snug text-ink">{listing.title}</h2>
        <p className="mt-1 flex items-center gap-1 text-xs font-bold text-mute">
          <MapPin aria-hidden="true" size={13} />
          {listing.area} / {listing.station}
        </p>
        <p className="mt-2 line-clamp-3 text-sm font-medium leading-relaxed text-mute">{listing.summary}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {listing.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="rounded-full bg-neutral-50 px-2 py-1 text-[0.62rem] font-black text-ink/72">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
          <span className="text-xs font-bold text-mute">希望時期：{listing.desiredTiming}</span>
          <span className="inline-flex items-center gap-1 text-xs font-black text-blush">
            詳細を見る
            <ArrowRight aria-hidden="true" size={13} />
          </span>
        </div>
      </Link>
    </article>
  );
}

export default function SalonTransitionPage() {
  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="OPENING / SUCCESSION"
        title="開業・承継"
        body="理容室を引き継ぎたい人、居抜きで開業したい人、備品を譲りたい人をつなぐ入口。"
      />

      <section className="px-4 pt-4">
        <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_12px_30px_rgba(17,17,17,0.045)]">
          <p className="text-sm font-medium leading-relaxed text-mute">
            BARBER HUBは、不動産仲介や契約代行を行いません。理容室の承継・居抜き・備品譲渡・独立希望に関する情報掲載と問い合わせ導線を提供します。
            契約や条件交渉は、貸主・管理会社・宅建業者・専門家へご確認ください。
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/salon-transition/register" className="inline-flex h-11 items-center justify-center rounded-[8px] bg-ink px-3 text-sm font-black text-white">
              掲載する
            </Link>
            <Link href="#listings" className="inline-flex h-11 items-center justify-center rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink">
              案件を見る
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-base font-black text-ink">カテゴリ</h2>
        <div className="mt-3 grid gap-2.5">
          {transitionCategories.map((category) => (
            <article key={category.id} className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blushSoft text-blush">
                  <Building2 aria-hidden="true" size={17} />
                </span>
                <div>
                  <h3 className="text-sm font-black text-ink">{category.title}</h3>
                  <p className="mt-1 text-xs font-bold leading-relaxed text-ink/72">{category.target}</p>
                  <p className="mt-1.5 text-xs font-medium leading-relaxed text-mute">{category.body}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="listings" className="px-4 pt-7">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[0.66rem] font-black uppercase tracking-[0.12em] text-blush">MOCK LISTINGS</p>
            <h2 className="mt-1 text-lg font-black text-ink">開業・承継の情報</h2>
          </div>
          <span className="rounded-full bg-neutral-50 px-2.5 py-1 text-[0.68rem] font-black text-mute">{salonTransitionListings.length}件</span>
        </div>
        <div className="grid gap-3">
          {salonTransitionListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="px-4 pt-7">
        <h2 className="text-base font-black text-ink">開業前チェックリスト</h2>
        <div className="mt-3 grid gap-2">
          {checklist.map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-[8px] border border-line bg-white p-3 text-xs font-black text-ink shadow-sm">
              <CheckCircle2 aria-hidden="true" size={15} className="shrink-0 text-blush" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pt-7">
        <h2 className="text-base font-black text-ink">開業・承継を相談できるパートナー</h2>
        <div className="mt-3 grid gap-2.5">
          {salonTransitionPartners.map((partner) => (
            <Link key={partner.id} href={partner.href} className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-line bg-neutral-50 px-2 py-0.5 text-[0.58rem] font-black text-mute">{partner.label}</span>
                <span className="text-sm font-black text-ink">{partner.title}</span>
              </div>
              <p className="mt-1 text-xs font-bold leading-relaxed text-ink/72">{partner.role}</p>
              <p className="mt-1 text-xs font-medium leading-relaxed text-mute">{partner.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 pt-7">
        <div className="rounded-[10px] border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <Sparkles aria-hidden="true" size={18} className="text-blush" />
            将来の掲載メニュー
          </div>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
            BARBER HUBは情報掲載・問い合わせ導線を提供します。契約や交渉は、当事者および専門家の確認のもとで行ってください。
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {transitionMonetizationItems.map((item) => (
              <span key={item} className="rounded-full bg-neutral-50 px-2.5 py-1 text-[0.62rem] font-black text-ink/72">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pt-6">
        <Link href="/salon-transition/register" className="flex items-center gap-3 rounded-[8px] border border-blush/20 bg-white p-4 shadow-sm">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-blushSoft text-blush">
            <Handshake aria-hidden="true" size={19} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black text-ink">開業・承継情報を掲載する</span>
            <span className="mt-0.5 block text-xs font-bold text-mute">閉店予定、引退予定、居抜き、備品譲渡、独立希望の仮登録。</span>
          </span>
        </Link>
      </section>

      <SalonTransitionNotice />
    </PageChrome>
  );
}
