"use client";

import { Building2, MapPin, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MagazineImage } from "@/components/MagazineImage";
import { MagazineFeaturedCard, MagazinePageHeader, MagazineSectionHeading } from "@/components/MagazineListLayout";
import {
  EMPLOYMENT_TYPE_OPTIONS,
  JOB_DIRECT_CONTACT_NOTICE,
  JOB_PREFECTURES,
  JOB_TAG_OPTIONS,
  JOB_TITLE_OPTIONS,
  splitJobMultiValue,
  uniqueTextValues,
} from "@/lib/jobs";
import { jobAreaLabel, jobCardDescription, type JobPost } from "@/lib/supabase/jobs";

type JobListingsViewProps = {
  jobs: JobPost[];
  loadError?: string | null;
};

function includesKeyword(job: JobPost, keyword: string) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return true;

  return [
    job.salon_name,
    job.employer_name,
    job.prefecture,
    job.city,
    job.station,
    job.job_title,
    job.employment_type,
    job.description,
    job.pr_message,
    job.salary,
    job.holidays,
    ...job.tags,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalized));
}

export function JobListingsView({ jobs, loadError }: JobListingsViewProps) {
  const [selectedPrefecture, setSelectedPrefecture] = useState("すべて");
  const [selectedCity, setSelectedCity] = useState("すべて");
  const [selectedJobTitle, setSelectedJobTitle] = useState("すべて");
  const [selectedEmploymentType, setSelectedEmploymentType] = useState("すべて");
  const [selectedTag, setSelectedTag] = useState("すべて");
  const [keyword, setKeyword] = useState("");

  const prefectures = useMemo(
    () => uniqueTextValues(["すべて", ...jobs.map((job) => job.prefecture), ...JOB_PREFECTURES]),
    [jobs]
  );
  const cities = useMemo(() => {
    const source = selectedPrefecture === "すべて" ? jobs : jobs.filter((job) => job.prefecture === selectedPrefecture);
    return uniqueTextValues(["すべて", ...source.map((job) => job.city)]);
  }, [jobs, selectedPrefecture]);

  const visibleJobs = jobs.filter((job) => {
    if (selectedPrefecture !== "すべて" && job.prefecture !== selectedPrefecture) return false;
    if (selectedCity !== "すべて" && job.city !== selectedCity) return false;
    if (selectedJobTitle !== "すべて" && !job.job_title.includes(selectedJobTitle)) return false;
    if (selectedEmploymentType !== "すべて" && !job.employment_type?.includes(selectedEmploymentType)) return false;
    if (selectedTag !== "すべて" && !job.tags.includes(selectedTag)) return false;
    return includesKeyword(job, keyword);
  });
  const featuredJob = jobs.find((job) => job.is_paid_featured) ?? jobs[0] ?? null;
  const listTitle = selectedPrefecture === "すべて" ? "求人一覧" : `${selectedPrefecture}の求人`;

  return (
    <>
      <MagazinePageHeader
        eyebrow="BARBER JOBS"
        title="理容師の求人を探す"
        description="地域、働き方、店の雰囲気から、見学したいサロンを見つける。"
        tags={["見学歓迎", "学生歓迎", "フェード", "少人数サロン"]}
      />

      <section className="px-4 pt-4">
        <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-3">
          <p className="text-sm font-black text-ink">BARBER HUBは求人情報の掲載場所です。</p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-mute">{JOB_DIRECT_CONTACT_NOTICE}</p>
        </div>
      </section>

      {loadError ? (
        <section className="px-4 pt-4">
          <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-xs font-black leading-relaxed text-red-700">
            {loadError}
          </div>
        </section>
      ) : null}

      {featuredJob ? (
        <MagazineFeaturedCard
          eyebrow="EDITOR'S JOB"
          item={{
            href: `/jobs/${featuredJob.id}`,
            label: featuredJob.is_paid_featured ? "FEATURED JOB" : "JOB",
            title: featuredJob.salon_name,
            description: jobCardDescription(featuredJob),
            imageUrl: featuredJob.image_url ?? undefined,
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
              <span className="text-xs font-black text-mute">キーワード</span>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="h-11 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush"
                placeholder="サロン名、駅、技術、条件など"
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
                <span className="text-xs font-black text-mute">職種</span>
                <select
                  value={selectedJobTitle}
                  onChange={(event) => setSelectedJobTitle(event.target.value)}
                  className="h-11 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush"
                >
                  {["すべて", ...JOB_TITLE_OPTIONS].map((label) => (
                    <option key={label}>{label}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-xs font-black text-mute">雇用形態</span>
                <select
                  value={selectedEmploymentType}
                  onChange={(event) => setSelectedEmploymentType(event.target.value)}
                  className="h-11 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush"
                >
                  {["すべて", ...EMPLOYMENT_TYPE_OPTIONS].map((label) => (
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

          <div className="mt-2 no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {["すべて", ...JOB_TAG_OPTIONS].map((tag) => (
              <button
                key={tag}
                type="button"
                className={
                  "shrink-0 rounded-full px-3 py-2 text-xs font-black transition " +
                  (selectedTag === tag ? "bg-blush text-white" : "border border-line bg-white text-ink")
                }
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pt-5">
        <MagazineSectionHeading eyebrow="JOB LIST" title={listTitle} />

        {visibleJobs.length === 0 ? (
          <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_26px_rgba(17,17,17,0.035)]">
            <p className="text-sm font-black text-ink">現在、この条件の求人はまだありません。</p>
            <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
              掲載サロンを募集しています。求人掲載は基本無料です。
            </p>
            <Link href="/post/job" className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-[8px] bg-ink px-4 text-sm font-black text-white">
              求人を掲載する
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {visibleJobs.map((job) => {
              const labels = [...splitJobMultiValue(job.job_title), ...splitJobMultiValue(job.employment_type)].slice(0, 4);
              return (
                <article key={job.id} className="rounded-[10px] border border-line/80 bg-white p-3 shadow-[0_10px_26px_rgba(17,17,17,0.035)]">
                  <Link href={`/jobs/${job.id}`} className="block">
                    <MagazineImage src={job.image_url ?? undefined} alt={job.salon_name} variant="student" className="aspect-[16/8.5]" />
                    <div className="mt-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-blush">JOB</p>
                        <h3 className="mt-1 text-[1.02rem] font-black leading-snug text-ink">{job.salon_name}</h3>
                        <p className="mt-1 flex items-center gap-1 text-xs font-bold text-mute">
                          <MapPin aria-hidden="true" size={13} />
                          {jobAreaLabel(job)}
                        </p>
                      </div>
                      {job.is_paid_featured ? (
                        <span className="rounded-full border border-blush/25 bg-blushSoft px-2 py-1 text-[0.58rem] font-black text-blush">注目</span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {labels.map((label) => (
                        <span key={label} className="rounded-full bg-neutral-50 px-2 py-1 text-[0.62rem] font-black text-ink">
                          {label}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 grid gap-1.5 text-xs font-bold text-mute">
                      {job.salary ? <p>給与目安：{job.salary}</p> : null}
                      {job.holidays ? <p>休日：{job.holidays}</p> : null}
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm font-medium leading-relaxed text-ink">{jobCardDescription(job)}</p>
                  </Link>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[0.68rem] font-black text-mute">
                      <ShieldCheck aria-hidden="true" size={13} className="text-blush" />
                      {job.visit_available ? "見学歓迎" : "見学相談"}
                    </span>
                    <Link href={`/profiles/${job.user_id}`} className="text-xs font-black text-blush">
                      サロンプロフィールを見る
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="px-4 pt-6">
        <div className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">SPONSORED CAREER</p>
          <h2 className="mt-1 text-base font-black text-ink">有料掲載は問い合わせで受付予定です</h2>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
            注目掲載・上位表示・トップページ掲載・編集部作成の求人記事などを準備しています。今は決済を行わず、希望サロンからのお問い合わせだけ受け付けます。
          </p>
          <Link href="/contact?topic=paid-jobs" className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-[8px] border border-line bg-white text-sm font-black text-ink">
            有料掲載について問い合わせる
          </Link>
        </div>
      </section>

      <section className="px-4 pt-6">
        <Link href="/succession" className="flex items-center gap-3 rounded-[8px] border border-line bg-white p-4 shadow-sm">
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
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href="/post/job" className="inline-flex h-10 items-center justify-center rounded-[8px] bg-ink px-3 text-sm font-black text-white">
              求人を掲載する
            </Link>
            <Link href="/jobs/about" className="inline-flex h-10 items-center justify-center rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink">
              掲載について
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
