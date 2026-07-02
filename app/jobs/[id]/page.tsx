import { Briefcase, CalendarDays, Clock, GraduationCap, MapPin, MessageSquareText, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { MagazineImage } from "@/components/MagazineImage";
import { PageChrome } from "@/components/PageChrome";
import { findJobListing } from "@/lib/jobs";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = findJobListing(id);

  if (job == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-8">
          <h1 className="text-2xl font-black text-ink">求人が見つかりません</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
            指定された求人は、現在掲載されていない可能性があります。
          </p>
          <Link href="/jobs" className="mt-5 inline-flex h-11 items-center justify-center rounded-[8px] bg-blush px-4 text-sm font-black text-white">
            求人一覧へ戻る
          </Link>
        </section>
      </PageChrome>
    );
  }

  return (
    <PageChrome>
      <article className="px-4 pt-5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blushSoft px-2.5 py-1 text-[0.68rem] font-black text-blush">求人</span>
          {job.sponsored ? <span className="rounded-full border border-line px-2.5 py-1 text-[0.68rem] font-black text-mute">PR</span> : null}
        </div>
        <h1 className="mt-3 text-[1.55rem] font-black leading-tight text-ink">{job.salonName}</h1>
        <p className="mt-2 flex items-center gap-1 text-sm font-bold text-mute">
          <MapPin aria-hidden="true" size={15} />
          {job.areaLabel}
        </p>
        <MagazineImage src={job.imageUrl} alt={job.salonName} variant="student" className="mt-4 aspect-[16/9]" />

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link href={`/jobs/${job.id}/apply?type=tour`} className="inline-flex h-11 items-center justify-center rounded-[8px] bg-ink px-3 text-sm font-black text-white">
            見学を申し込む
          </Link>
          <Link href={`/jobs/${job.id}/apply?type=interview`} className="inline-flex h-11 items-center justify-center rounded-[8px] bg-blush px-3 text-sm font-black text-white">
            面接を申し込む
          </Link>
        </div>
      </article>

      <section className="grid gap-2 px-4 pt-5">
        <InfoRow icon={Briefcase} label="募集職種" value={job.roles.join(" / ")} />
        <InfoRow icon={GraduationCap} label="雇用形態" value={job.employmentTypes.join(" / ")} />
        <InfoRow icon={Sparkles} label="給与" value={job.salary} />
        <InfoRow icon={Clock} label="勤務時間" value={job.workingHours} />
        <InfoRow icon={CalendarDays} label="休日" value={job.holidays} />
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-base font-black text-ink">このサロンについて</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-ink">{job.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {job.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-line bg-white px-3 py-2 text-xs font-black text-ink">
              {tag}
            </span>
          ))}
        </div>
      </section>

      <section className="px-4 pt-6">
        <div className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <MessageSquareText aria-hidden="true" size={18} className="text-blush" />
            サロンからのメッセージ
          </div>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">{job.message}</p>
        </div>
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-base font-black text-ink">福利厚生・練習環境</h2>
        <div className="mt-3 grid gap-2">
          {job.benefits.map((benefit) => (
            <div key={benefit} className="rounded-[8px] bg-neutral-50 p-3 text-sm font-bold text-ink">
              {benefit}
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pt-6">
        <div className="rounded-[8px] bg-ink p-4 text-white">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.12em] text-white/60">SALON SNAP</p>
          <h2 className="mt-2 text-lg font-black">このサロンの雰囲気</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-white/70">
            MVPではダミー枠です。将来的に、このサロンのSnapや記事、スタッフの考え方が分かる投稿を表示します。
          </p>
        </div>
      </section>
    </PageChrome>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[8px] border border-line bg-white p-3 shadow-sm">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blushSoft text-blush">
        <Icon aria-hidden="true" size={17} />
      </span>
      <div>
        <p className="text-[0.68rem] font-black text-mute">{label}</p>
        <p className="mt-0.5 text-sm font-black leading-snug text-ink">{value}</p>
      </div>
    </div>
  );
}
