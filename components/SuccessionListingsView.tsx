"use client";

import { Building2, MapPin, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MagazineImage } from "@/components/MagazineImage";
import { MagazineFeaturedCard, MagazinePageHeader, MagazineSectionHeading } from "@/components/MagazineListLayout";
import {
  SUCCESSION_BUSINESS_TYPES,
  SUCCESSION_DIRECT_NOTICE,
  SUCCESSION_LISTING_TYPES,
  SUCCESSION_NOTICE,
  uniqueTextValues,
} from "@/lib/succession";
import { successionAreaLabel, successionSpecs, type SuccessionPublicPost } from "@/lib/supabase/succession";

type SuccessionListingsViewProps = {
  posts: SuccessionPublicPost[];
  loadError?: string | null;
};

function includesKeyword(post: SuccessionPublicPost, keyword: string) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return true;

  return [
    post.listing_type,
    post.title,
    post.public_description,
    post.prefecture,
    post.city,
    post.area,
    post.business_type,
    post.years_open,
    post.desired_timing,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalized));
}

export function SuccessionListingsView({ posts, loadError }: SuccessionListingsViewProps) {
  const [selectedPrefecture, setSelectedPrefecture] = useState("すべて");
  const [selectedCity, setSelectedCity] = useState("すべて");
  const [selectedType, setSelectedType] = useState("すべて");
  const [selectedBusinessType, setSelectedBusinessType] = useState("すべて");
  const [keyword, setKeyword] = useState("");

  const prefectures = useMemo(() => uniqueTextValues(["すべて", ...posts.map((post) => post.prefecture)]), [posts]);
  const cities = useMemo(() => {
    const source = selectedPrefecture === "すべて" ? posts : posts.filter((post) => post.prefecture === selectedPrefecture);
    return uniqueTextValues(["すべて", ...source.map((post) => post.city)]);
  }, [posts, selectedPrefecture]);

  const visiblePosts = posts.filter((post) => {
    if (selectedPrefecture !== "すべて" && post.prefecture !== selectedPrefecture) return false;
    if (selectedCity !== "すべて" && post.city !== selectedCity) return false;
    if (selectedType !== "すべて" && post.listing_type !== selectedType) return false;
    if (selectedBusinessType !== "すべて" && post.business_type !== selectedBusinessType) return false;
    return includesKeyword(post, keyword);
  });
  const featuredPost = posts.find((post) => post.is_paid_featured) ?? posts[0] ?? null;
  const listTitle = selectedPrefecture === "すべて" ? "開業・承継情報" : `${selectedPrefecture}の開業・承継情報`;

  return (
    <>
      <MagazinePageHeader
        eyebrow="BARBER SUCCESSION"
        title="開業・承継を探す"
        description="居抜き・設備譲渡・後継者募集。地域の理容室を次の世代へ。"
        tags={["居抜き", "設備譲渡", "後継者募集", "地域承継"]}
      />

      <section className="px-4 pt-4">
        <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_12px_30px_rgba(17,17,17,0.035)]">
          <p className="text-sm font-black text-ink">BARBER HUBは開業・承継情報の掲載場所です。</p>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">{SUCCESSION_NOTICE}</p>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">{SUCCESSION_DIRECT_NOTICE}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/post/succession" className="inline-flex h-11 items-center justify-center rounded-[8px] bg-ink px-3 text-sm font-black text-white">
              掲載する
            </Link>
            <Link href="/succession/about" className="inline-flex h-11 items-center justify-center rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink">
              掲載について
            </Link>
          </div>
        </div>
      </section>

      {loadError ? (
        <section className="px-4 pt-4">
          <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-xs font-black leading-relaxed text-red-700">
            {loadError}
          </div>
        </section>
      ) : null}

      {featuredPost ? (
        <MagazineFeaturedCard
          eyebrow="FEATURED"
          item={{
            href: `/succession/${featuredPost.id}`,
            label: featuredPost.listing_type,
            title: featuredPost.title,
            description: featuredPost.public_description,
            imageUrl: featuredPost.public_image_url ?? undefined,
            variant: "news",
          }}
        />
      ) : null}

      <section className="px-4 pt-4">
        <div className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <Search aria-hidden="true" size={17} className="text-blush" />
            条件から探す
          </div>

          <div className="mt-3 grid gap-3">
            <label className="grid gap-1.5">
              <span className="text-xs font-black text-mute">キーワード</span>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="h-11 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush"
                placeholder="地域、業態、希望時期など"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1.5">
                <span className="text-xs font-black text-mute">都道府県</span>
                <select
                  value={selectedPrefecture}
                  onChange={(event) => {
                    setSelectedPrefecture(event.target.value);
                    setSelectedCity("すべて");
                  }}
                  className="h-11 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush"
                >
                  {prefectures.map((prefecture) => (
                    <option key={prefecture}>{prefecture}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-black text-mute">市区町村</span>
                <select
                  value={selectedCity}
                  onChange={(event) => setSelectedCity(event.target.value)}
                  className="h-11 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush"
                >
                  {cities.map((city) => (
                    <option key={city}>{city}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1.5">
                <span className="text-xs font-black text-mute">掲載タイプ</span>
                <select
                  value={selectedType}
                  onChange={(event) => setSelectedType(event.target.value)}
                  className="h-11 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush"
                >
                  {["すべて", ...SUCCESSION_LISTING_TYPES].map((label) => (
                    <option key={label}>{label}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-black text-mute">業態</span>
                <select
                  value={selectedBusinessType}
                  onChange={(event) => setSelectedBusinessType(event.target.value)}
                  className="h-11 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush"
                >
                  {["すべて", ...SUCCESSION_BUSINESS_TYPES].map((label) => (
                    <option key={label}>{label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-3 no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {cities.map((city) => (
              <button
                key={city}
                type="button"
                className={
                  "shrink-0 rounded-full px-3 py-2 text-xs font-black transition " +
                  (selectedCity === city ? "bg-ink text-white" : "border border-line bg-white text-ink")
                }
                onClick={() => setSelectedCity(city)}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pt-5">
        <MagazineSectionHeading eyebrow="LISTINGS" title={listTitle} />

        {visiblePosts.length === 0 ? (
          <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_26px_rgba(17,17,17,0.035)]">
            <p className="text-sm font-black text-ink">現在、この条件の掲載はまだありません。</p>
            <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
              開業・承継情報を掲載する方を募集しています。掲載は基本無料です。
            </p>
            <Link href="/post/succession" className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-[8px] bg-ink px-4 text-sm font-black text-white">
              開業・承継情報を掲載する
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {visiblePosts.map((post) => (
              <article key={post.id} className="rounded-[10px] border border-line/80 bg-white p-3 shadow-[0_10px_26px_rgba(17,17,17,0.035)]">
                <Link href={`/succession/${post.id}`} className="block">
                  <MagazineImage src={post.public_image_url ?? undefined} alt={post.title} variant="news" className="aspect-[16/8.5]" />
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-blushSoft px-2.5 py-1 text-[0.62rem] font-black text-blush">{post.listing_type}</span>
                    {post.business_type ? (
                      <span className="rounded-full border border-line bg-neutral-50 px-2.5 py-1 text-[0.62rem] font-black text-mute">{post.business_type}</span>
                    ) : null}
                    {post.is_paid_featured ? (
                      <span className="rounded-full border border-blush/25 bg-white px-2.5 py-1 text-[0.62rem] font-black text-blush">注目</span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-base font-black leading-snug text-ink">{post.title}</h2>
                  <p className="mt-1 flex items-center gap-1 text-xs font-bold text-mute">
                    <MapPin aria-hidden="true" size={13} />
                    {successionAreaLabel(post)}
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm font-medium leading-relaxed text-mute">{post.public_description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {successionSpecs(post).slice(0, 5).map((spec) => (
                      <span key={spec} className="rounded-full bg-neutral-50 px-2 py-1 text-[0.62rem] font-black text-ink/72">
                        {spec}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                    <span className="inline-flex items-center gap-1 text-[0.68rem] font-black text-mute">
                      <ShieldCheck aria-hidden="true" size={13} className="text-blush" />
                      詳細条件は確認後に共有
                    </span>
                    <span className="text-xs font-black text-blush">詳細を見る</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="px-4 pt-6">
        <div className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">PAID OPTIONS</p>
          <h2 className="mt-1 text-base font-black text-ink">有料掲載は問い合わせで受付予定です</h2>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
            注目掲載・上位表示・編集部作成の承継紹介記事・地域特集との連動を準備しています。今は決済を行わず、お問い合わせだけ受け付けます。
          </p>
          <Link href="/contact?topic=succession-paid" className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-[8px] border border-line bg-white text-sm font-black text-ink">
            有料掲載について問い合わせる
          </Link>
        </div>
      </section>

      <section className="px-4 pt-6">
        <Link href="/partners/dealers" className="flex items-center gap-3 rounded-[8px] border border-line bg-white p-4 shadow-sm">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-blushSoft text-blush">
            <Building2 aria-hidden="true" size={19} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black text-ink">開業準備の相談先</span>
            <span className="mt-0.5 block text-xs font-bold leading-relaxed text-mute">道具・設備・内装・専門家確認は、各分野の相談先と慎重に進めてください。</span>
          </span>
        </Link>
      </section>
    </>
  );
}
