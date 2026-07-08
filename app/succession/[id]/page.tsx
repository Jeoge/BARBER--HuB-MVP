import { ArrowLeft, Building2, CalendarDays, MapPin, MessageSquareText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { MagazineImage } from "@/components/MagazineImage";
import { PageChrome } from "@/components/PageChrome";
import { SUCCESSION_DIRECT_NOTICE, SUCCESSION_NOTICE } from "@/lib/succession";
import { getPublishedSuccessionPost, successionAreaLabel } from "@/lib/supabase/succession";
import { createClient } from "@/lib/supabase/server";

type SuccessionDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ posted?: string; updated?: string }>;
};

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === "") return null;

  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-3 px-3 py-3 text-sm">
      <span className="font-bold text-mute">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

export default async function SuccessionDetailPage({ params, searchParams }: SuccessionDetailPageProps) {
  const { id } = await params;
  const notices = await searchParams;
  const supabase = await createClient();
  const { post } = await getPublishedSuccessionPost(supabase, id);

  if (post == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-8">
          <h1 className="text-2xl font-black text-ink">掲載が見つかりません</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
            指定された開業・承継情報は、現在掲載されていない可能性があります。
          </p>
          <Link href="/succession" className="mt-5 inline-flex h-11 items-center justify-center rounded-[8px] bg-blush px-4 text-sm font-black text-white">
            一覧へ戻る
          </Link>
        </section>
      </PageChrome>
    );
  }

  return (
    <PageChrome>
      <section className="px-4 pt-4">
        <Link href="/succession" className="inline-flex items-center gap-1.5 text-xs font-black text-mute">
          <ArrowLeft aria-hidden="true" size={14} />
          開業・承継へ戻る
        </Link>
      </section>

      <section className="px-4 pt-4">
        {notices?.posted ? (
          <div className="mb-4 rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-sm font-black leading-relaxed text-ink">
            開業・承継情報を保存しました。公開状態の掲載として表示されています。
          </div>
        ) : null}
        {notices?.updated ? (
          <div className="mb-4 rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-sm font-black leading-relaxed text-ink">
            開業・承継情報を更新しました。
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[10px] border border-line bg-white shadow-[0_12px_30px_rgba(17,17,17,0.045)]">
          <MagazineImage src={post.public_image_url ?? undefined} alt={post.title} variant="news" className="aspect-[16/9]" />
          <div className="p-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-blushSoft px-2.5 py-1 text-[0.62rem] font-black text-blush">{post.listing_type}</span>
              {post.business_type ? (
                <span className="rounded-full border border-line bg-neutral-50 px-2.5 py-1 text-[0.62rem] font-black text-mute">{post.business_type}</span>
              ) : null}
              <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[0.62rem] font-black text-mute">匿名性を優先</span>
            </div>
            <h1 className="mt-3 text-[1.55rem] font-black leading-tight text-ink">{post.title}</h1>
            <p className="mt-2 flex items-center gap-1 text-xs font-bold text-mute">
              <MapPin aria-hidden="true" size={14} />
              {successionAreaLabel(post)}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-ink">{post.public_description}</p>
          </div>
        </div>
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-base font-black text-ink">公開情報</h2>
        <div className="mt-3 divide-y divide-line rounded-[8px] border border-line bg-white">
          <InfoRow label="掲載タイプ" value={post.listing_type} />
          <InfoRow label="都道府県" value={post.prefecture} />
          <InfoRow label="市区町村" value={post.city} />
          <InfoRow label="エリア" value={post.area} />
          <InfoRow label="業態" value={post.business_type} />
          <InfoRow label="席数" value={post.seats_count != null ? `${post.seats_count}席` : null} />
          <InfoRow label="シャンプー台" value={post.shampoo_count != null ? `${post.shampoo_count}台` : null} />
          <InfoRow label="開業年数" value={post.years_open} />
          <InfoRow label="希望時期" value={post.desired_timing} />
        </div>
      </section>

      <section className="px-4 pt-6">
        <div className="rounded-[10px] border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <MessageSquareText aria-hidden="true" size={18} className="text-blush" />
            問い合わせ
          </div>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
            店舗名、正確な住所、金額、売上、連絡先などの詳細条件は公開していません。必要な情報は、運営確認後または当事者間で慎重に確認してください。
          </p>
          <Link href="/contact?topic=succession" className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink text-sm font-black text-white">
            運営へ問い合わせる
          </Link>
        </div>
      </section>

      <section className="px-4 pt-6">
        <div className="rounded-[8px] border border-line bg-neutral-50 p-3">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <ShieldCheck aria-hidden="true" size={18} className="text-blush" />
            注意事項
          </div>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">{SUCCESSION_NOTICE}</p>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">{SUCCESSION_DIRECT_NOTICE}</p>
        </div>
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-base font-black text-ink">確認しておきたいこと</h2>
        <div className="mt-3 grid gap-2">
          {["貸主・管理会社への確認", "宅建業者への物件確認", "税務・法務・契約の専門家相談", "設備状態と受け渡し方法の確認"].map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-[8px] border border-line bg-white p-3 text-xs font-black text-ink shadow-sm">
              {item.includes("契約") ? <CalendarDays aria-hidden="true" size={15} className="shrink-0 text-blush" /> : <Building2 aria-hidden="true" size={15} className="shrink-0 text-blush" />}
              {item}
            </div>
          ))}
        </div>
      </section>
    </PageChrome>
  );
}
