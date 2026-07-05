"use client";

import { Building2, MapPin, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MagazineImage } from "@/components/MagazineImage";
import { MagazineFeaturedCard, MagazinePageHeader, MagazineSectionHeading } from "@/components/MagazineListLayout";
import { PageChrome } from "@/components/PageChrome";
import { SponsorSection } from "@/components/SponsorSection";
import { citiesByPrefecture, jobListings, prefectures } from "@/lib/jobs";
import { sponsorsForPlacement } from "@/lib/sponsors";

export default function JobsPage() {
  const [selectedPrefecture, setSelectedPrefecture] = useState(prefectures[0]);
  const [selectedCity, setSelectedCity] = useState("すべて");

  const cities = ["すべて", ...(citiesByPrefecture[selectedPrefecture] ?? [])];
  const visibleJobs = jobListings.filter((job) => {
    if (job.prefecture !== selectedPrefecture) return false;
    if (selectedCity !== "すべて" && job.city !== selectedCity) return false;
    return true;
  });
  const featuredJob = jobListings.find((job) => job.featured) ?? jobListings[0];

  return (
    <PageChrome>
      <MagazinePageHeader
        eyebrow="BARBER JOBS"
        title="理容師の求人を探す"
        description="地域、働き方、店の雰囲気から、見学したいサロンを見つける。"
        tags={["見学歓迎", "学生歓迎", "フェード", "少人数サロン"]}
      />

      {featuredJob ? (
        <MagazineFeaturedCard
          eyebrow="EDITOR'S JOB"
          item={{
            href: `/jobs/${featuredJob.id}`,
            label: featuredJob.featured ? "FEATURED JOB" : "JOB",
            title: featuredJob.salonName,
            description: featuredJob.description,
            imageUrl: featuredJob.imageUrl,
            variant: "student",
          }}
        />
      ) : null}

      <section className="px-4 pt-4">
        <div className="rounded-[8px] border border-line bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <Search aria-hidden="true" size={17} className="text-blush" />
            地域から探す
          </div>

          <div className="mt-3 grid gap-3">
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
        <MagazineSectionHeading eyebrow="JOB LIST" title={`${selectedPrefecture}の求人`} />

        <div className="grid gap-3">
          {visibleJobs.map((job) => (
            <article key={job.id} className="rounded-[10px] border border-line/80 bg-white p-3 shadow-[0_10px_26px_rgba(17,17,17,0.035)]">
              <Link href={`/jobs/${job.id}`} className="block">
                <MagazineImage src={job.imageUrl} alt={job.salonName} variant="student" className="aspect-[16/8.5]" />
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-blush">JOB</p>
                    <h3 className="mt-1 text-[1.02rem] font-black leading-snug text-ink">{job.salonName}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs font-bold text-mute">
                      <MapPin aria-hidden="true" size={13} />
                      {job.areaLabel}
                    </p>
                  </div>
                  {job.sponsored ? (
                    <span className="rounded-full border border-line px-2 py-1 text-[0.58rem] font-black text-mute">PR</span>
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[...job.roles, ...job.employmentTypes].slice(0, 4).map((label) => (
                    <span key={label} className="rounded-full bg-neutral-50 px-2 py-1 text-[0.62rem] font-black text-ink">
                      {label}
                    </span>
                  ))}
                </div>
                <div className="mt-3 grid gap-1.5 text-xs font-bold text-mute">
                  <p>給与目安：{job.salary}</p>
                  <p>休日：{job.holidays}</p>
                </div>
                <p className="mt-3 line-clamp-2 text-sm font-medium leading-relaxed text-ink">{job.description}</p>
              </Link>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-[0.68rem] font-black text-mute">
                  <ShieldCheck aria-hidden="true" size={13} className="text-blush" />
                  見学歓迎
                </span>
                <Link href={`/profiles/${job.profileId}`} className="text-xs font-black text-blush">
                  サロンプロフィールを見る
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <SponsorSection
        eyebrow="Sponsored Career"
        title="求職者向け協賛情報"
        subtitle="学校・地域の若手支援など、求人探しに近いお知らせです。"
        items={sponsorsForPlacement("jobs")}
        compact
      />

      <section className="px-4 pt-6">
        <Link href="/salon-transition" className="flex items-center gap-3 rounded-[8px] border border-line bg-white p-4 shadow-sm">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-blushSoft text-blush">
            <Building2 aria-hidden="true" size={19} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black text-ink">居抜きで開業したい方へ</span>
            <span className="mt-0.5 block text-xs font-bold leading-relaxed text-mute">求人だけでなく、承継・備品譲渡・独立準備の情報も確認できます。</span>
          </span>
        </Link>
      </section>

      <section className="px-4 pt-6">
        <div className="rounded-[8px] border border-line bg-neutral-50 p-4">
          <p className="text-sm font-black text-ink">サロンの方へ</p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-mute">
            求人掲載は今後も基本無料で始められる設計です。Snapや記事でお店の雰囲気を伝えることも、採用のきっかけになります。
          </p>
          <Link href="/jobs/register" className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-[8px] border border-line bg-white text-sm font-black text-ink">
            求人を掲載する
          </Link>
        </div>
      </section>
    </PageChrome>
  );
}
