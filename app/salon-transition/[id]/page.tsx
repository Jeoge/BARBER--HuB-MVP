import { ArrowLeft, Mail, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MagazineImage } from "@/components/MagazineImage";
import { PageChrome } from "@/components/PageChrome";
import { SalonTransitionNotice } from "@/components/SalonTransitionNotice";
import {
  findSalonTransitionListing,
  salonTransitionListings,
  salonTransitionPartners,
} from "@/lib/salon-transition";

export function generateStaticParams() {
  return salonTransitionListings.map((listing) => ({ id: listing.id }));
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-3 px-3 py-3 text-sm">
      <span className="font-bold text-mute">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

export default async function SalonTransitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = findSalonTransitionListing(id);

  if (listing == null) {
    notFound();
  }

  const rows = [
    ["地域", listing.storeInfo.region],
    ["最寄駅", listing.storeInfo.nearestStation],
    ["営業年数", listing.storeInfo.yearsOpen],
    ["席数", listing.storeInfo.seats],
    ["シャンプー台", listing.storeInfo.shampooUnits],
    ["広さ", listing.storeInfo.size],
    ["家賃目安", listing.storeInfo.rentGuide],
    ["契約区分", listing.storeInfo.tenantType],
    ["貸主承諾状況", listing.storeInfo.landlordConsentStatus],
    ["保健所関連", listing.storeInfo.healthCenterStatus],
  ] as const;

  return (
    <PageChrome>
      <section className="px-4 pt-4">
        <Link href="/salon-transition" className="inline-flex items-center gap-1.5 text-xs font-black text-mute">
          <ArrowLeft aria-hidden="true" size={14} />
          開業・承継へ戻る
        </Link>
      </section>

      <section className="px-4 pt-4">
        <div className="overflow-hidden rounded-[10px] border border-line bg-white shadow-[0_12px_30px_rgba(17,17,17,0.045)]">
          <MagazineImage src={listing.imageUrl} alt={listing.title} variant={listing.type === "equipment" ? "tool" : "news"} className="aspect-[16/9]" />
          <div className="p-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-blushSoft px-2.5 py-1 text-[0.62rem] font-black text-blush">{listing.typeLabel}</span>
              <span className="rounded-full border border-line bg-neutral-50 px-2.5 py-1 text-[0.62rem] font-black text-mute">{listing.status}</span>
              {listing.isAnonymous ? (
                <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[0.62rem] font-black text-mute">匿名掲載</span>
              ) : null}
            </div>
            <h1 className="mt-3 text-[1.55rem] font-black leading-tight text-ink">{listing.title}</h1>
            <p className="mt-2 flex items-center gap-1 text-xs font-bold text-mute">
              <MapPin aria-hidden="true" size={14} />
              {listing.area} / {listing.station}
            </p>
            <p className="mt-3 text-sm font-medium leading-relaxed text-ink">{listing.summary}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {listing.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-neutral-50 px-2.5 py-1 text-[0.62rem] font-black text-ink/72">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-base font-black text-ink">店舗情報</h2>
        <div className="mt-3 divide-y divide-line rounded-[8px] border border-line bg-white">
          {rows.map(([label, value]) => (
            <InfoRow key={label} label={label} value={value} />
          ))}
        </div>
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-base font-black text-ink">設備情報</h2>
        <div className="mt-3 flex flex-wrap gap-2 rounded-[8px] border border-line bg-white p-3">
          {listing.equipment.map((item) => (
            <span key={item} className="rounded-full bg-neutral-50 px-2.5 py-1 text-[0.66rem] font-black text-ink/78">
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-base font-black text-ink">希望条件</h2>
        <div className="mt-3 grid gap-2">
          <p className="rounded-[8px] border border-line bg-white p-3 text-sm font-black text-ink">希望時期：{listing.desiredTiming}</p>
          {listing.conditions.map((condition) => (
            <p key={condition} className="rounded-[8px] border border-line bg-white p-3 text-xs font-bold leading-relaxed text-mute">
              {condition}
            </p>
          ))}
        </div>
      </section>

      <section className="px-4 pt-6">
        <div className="rounded-[10px] border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <Mail aria-hidden="true" size={18} className="text-blush" />
            問い合わせ
          </div>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
            MVPでは問い合わせボタンの表示のみです。正式公開時には、運営確認後に掲載者へ問い合わせをつなぐ設計にします。
          </p>
          <Link href="/salon-transition/register" className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink text-sm font-black text-white">
            掲載者へ問い合わせる
          </Link>
        </div>
      </section>

      <section className="px-4 pt-6">
        <div className="rounded-[8px] border border-line bg-neutral-50 p-3">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <ShieldCheck aria-hidden="true" size={18} className="text-blush" />
            注意事項
          </div>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
            実際の不動産条件や契約条件は、必ず貸主・管理会社・宅地建物取引業者等に確認してください。設備譲渡、顧客引き継ぎ、雇用、税務、法務は必要に応じて専門家へご相談ください。
          </p>
        </div>
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-base font-black text-ink">専門家相談導線</h2>
        <div className="mt-3 grid gap-2.5">
          {salonTransitionPartners.slice(0, 4).map((partner) => (
            <Link key={partner.id} href={partner.href} className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-line bg-neutral-50 px-2 py-0.5 text-[0.58rem] font-black text-mute">{partner.label}</span>
                <span className="text-sm font-black text-ink">{partner.title}</span>
              </div>
              <p className="mt-1 text-xs font-medium leading-relaxed text-mute">{partner.role}</p>
            </Link>
          ))}
        </div>
      </section>

      <SalonTransitionNotice />
    </PageChrome>
  );
}
