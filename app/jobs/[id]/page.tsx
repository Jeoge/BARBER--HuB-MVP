import { Briefcase, CalendarDays, Clock, GraduationCap, MapPin, MessageSquareText, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { MagazineImage } from "@/components/MagazineImage";
import { PageChrome } from "@/components/PageChrome";
import { JOB_DIRECT_CONTACT_NOTICE } from "@/lib/jobs";
import {
  getPublishedJobPost,
  isExternalContactHref,
  jobAreaLabel,
  jobContactLinks,
  type JobContactLink,
} from "@/lib/supabase/jobs";
import { createClient } from "@/lib/supabase/server";

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ posted?: string; updated?: string }>;
};

export default async function JobDetailPage({ params, searchParams }: JobDetailPageProps) {
  const { id } = await params;
  const notices = await searchParams;
  const supabase = await createClient();
  const { job } = await getPublishedJobPost(supabase, id);

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

  const profileHref = `/profiles/${job.user_id}`;
  const contactLinks = jobContactLinks(job);
  const primaryContact = contactLinks[0] ?? null;

  return (
    <PageChrome>
      <article className="px-4 pt-5">
        {notices?.posted ? (
          <div className="mb-4 rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-sm font-black leading-relaxed text-ink">
            求人を保存しました。公開状態の求人として表示されています。
          </div>
        ) : null}
        {notices?.updated ? (
          <div className="mb-4 rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-sm font-black leading-relaxed text-ink">
            求人を更新しました。
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blushSoft px-2.5 py-1 text-[0.68rem] font-black text-blush">求人</span>
          {job.is_paid_featured ? <span className="rounded-full border border-blush/25 px-2.5 py-1 text-[0.68rem] font-black text-blush">注目</span> : null}
        </div>
        <h1 className="mt-3 text-[1.55rem] font-black leading-tight text-ink">{job.salon_name}</h1>
        <p className="mt-2 flex items-center gap-1 text-sm font-bold text-mute">
          <MapPin aria-hidden="true" size={15} />
          {jobAreaLabel(job)}
        </p>
        <MagazineImage src={job.image_url ?? undefined} alt={job.salon_name} variant="student" className="mt-4 aspect-[16/9]" />

        <div className="mt-4 grid grid-cols-2 gap-2">
          {primaryContact ? (
            <ContactButton link={primaryContact} primary />
          ) : (
            <Link href="#contact" className="inline-flex h-11 items-center justify-center rounded-[8px] bg-ink px-3 text-sm font-black text-white">
              連絡先を見る
            </Link>
          )}
          <Link href={profileHref} className="inline-flex h-11 items-center justify-center rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink">
            プロフィール
          </Link>
        </div>
      </article>

      <section className="px-4 pt-5">
        <div className="rounded-[10px] border border-line bg-white p-4 shadow-sm">
          <p className="text-[0.66rem] font-black uppercase tracking-[0.12em] text-blush">PROFILE LINK</p>
          <h2 className="mt-1 text-base font-black text-ink">条件だけでなく、投稿からサロンの雰囲気も確認できます。</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
            店舗プロフィールでは、最近のSnapや記事、SNSリンクも確認できます。
          </p>
          <Link href={profileHref} className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-[8px] border border-line bg-white text-sm font-black text-ink">
            サロンプロフィールを見る
          </Link>
        </div>
      </section>

      <section className="grid gap-2 px-4 pt-5">
        <InfoRow icon={Briefcase} label="募集職種" value={job.job_title} />
        {job.employment_type ? <InfoRow icon={GraduationCap} label="雇用形態" value={job.employment_type} /> : null}
        {job.salary ? <InfoRow icon={Sparkles} label="給与" value={job.salary} /> : null}
        {job.working_hours ? <InfoRow icon={Clock} label="勤務時間" value={job.working_hours} /> : null}
        {job.holidays ? <InfoRow icon={CalendarDays} label="休日" value={job.holidays} /> : null}
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-base font-black text-ink">仕事内容</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-ink">{job.description}</p>
        {job.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {job.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-line bg-white px-3 py-2 text-xs font-black text-ink">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      {job.pr_message ? (
        <section className="px-4 pt-6">
          <div className="rounded-[8px] border border-line bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-black text-ink">
              <MessageSquareText aria-hidden="true" size={18} className="text-blush" />
              サロンPR
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-mute">{job.pr_message}</p>
          </div>
        </section>
      ) : null}

      {(job.benefits || job.trial_period) ? (
        <section className="px-4 pt-6">
          <h2 className="text-base font-black text-ink">福利厚生・手当</h2>
          <div className="mt-3 grid gap-2">
            {job.benefits ? (
              <div className="rounded-[8px] bg-neutral-50 p-3 text-sm font-bold leading-relaxed text-ink">{job.benefits}</div>
            ) : null}
            {job.trial_period ? (
              <div className="rounded-[8px] bg-neutral-50 p-3 text-sm font-bold leading-relaxed text-ink">試用期間：{job.trial_period}</div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section id="contact" className="px-4 pt-6">
        <div className="rounded-[8px] bg-ink p-4 text-white">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.12em] text-white/60">DIRECT CONTACT</p>
          <h2 className="mt-2 text-lg font-black">応募・見学方法</h2>
          {job.application_method ? (
            <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-white/76">{job.application_method}</p>
          ) : null}
          {contactLinks.length > 0 ? (
            <div className="mt-4 grid gap-2">
              {contactLinks.map((link) => (
                <ContactButton key={`${link.label}-${link.href}`} link={link} />
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-[8px] bg-white/10 p-3 text-sm font-bold leading-relaxed text-white/76">
              直接連絡先が未設定です。サロンプロフィールのリンクをご確認ください。
            </p>
          )}
        </div>
      </section>

      <section className="px-4 pt-6">
        <div className="rounded-[8px] border border-line bg-neutral-50 p-4">
          <h2 className="text-sm font-black text-ink">応募前にご確認ください</h2>
          <p className="mt-2 text-xs font-medium leading-relaxed text-mute">{JOB_DIRECT_CONTACT_NOTICE}</p>
        </div>
      </section>
    </PageChrome>
  );
}

function ContactButton({ link, primary = false }: { link: JobContactLink; primary?: boolean }) {
  const className = primary
    ? "inline-flex h-11 items-center justify-center rounded-[8px] bg-ink px-3 text-sm font-black text-white"
    : "inline-flex h-10 items-center justify-center rounded-[8px] bg-white px-3 text-sm font-black text-ink";

  if (isExternalContactHref(link.href)) {
    return (
      <a href={link.href} target="_blank" rel="noreferrer" className={className}>
        {link.label}
      </a>
    );
  }

  return (
    <a href={link.href} className={className}>
      {link.label}
    </a>
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
        <p className="mt-0.5 whitespace-pre-wrap text-sm font-black leading-snug text-ink">{value}</p>
      </div>
    </div>
  );
}
