import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { PageChrome } from "@/components/PageChrome";
import { JOB_DIRECT_CONTACT_NOTICE } from "@/lib/jobs";
import { getPublishedJobPost, isExternalContactHref, jobContactLinks, type JobContactLink } from "@/lib/supabase/jobs";
import { createClient } from "@/lib/supabase/server";

export default async function JobApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { job } = await getPublishedJobPost(supabase, id);

  if (job == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-8">
          <h1 className="text-2xl font-black text-ink">求人が見つかりません</h1>
          <Link href="/jobs" className="mt-5 inline-flex h-11 items-center justify-center rounded-[8px] bg-blush px-4 text-sm font-black text-white">
            求人一覧へ戻る
          </Link>
        </section>
      </PageChrome>
    );
  }

  const contactLinks = jobContactLinks(job);

  return (
    <PageChrome>
      <section className="px-4 pt-5">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-blush">DIRECT CONTACT</p>
        <h1 className="mt-1 text-[1.55rem] font-black leading-tight text-ink">掲載サロンへ直接連絡する</h1>
        <p className="mt-2 text-[0.86rem] font-medium leading-relaxed text-mute">
          {job.salon_name}への応募・見学・条件確認は、掲載サロンの連絡先から直接行ってください。
        </p>
        <Link href={`/jobs/${job.id}`} className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-[8px] border border-line bg-white text-sm font-black text-ink">
          求人詳細に戻る
        </Link>
      </section>

      <section className="grid gap-4 px-4 pt-5">
        <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-3">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <CheckCircle2 aria-hidden="true" size={18} className="text-blush" />
            BARBER HUBでは応募フォームを作りません
          </div>
          <p className="mt-2 text-[0.78rem] font-medium leading-relaxed text-mute">{JOB_DIRECT_CONTACT_NOTICE}</p>
        </div>

        {job.application_method ? (
          <div className="rounded-[8px] border border-line bg-white p-3">
            <p className="text-sm font-black text-ink">応募・見学方法</p>
            <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-mute">{job.application_method}</p>
          </div>
        ) : null}

        {contactLinks.length > 0 ? (
          <div className="grid gap-2">
            {contactLinks.map((link) => (
              <ContactLink key={`${link.label}-${link.href}`} link={link} />
            ))}
          </div>
        ) : (
          <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-sm font-bold leading-relaxed text-mute">
            直接連絡先が未設定です。サロンプロフィールをご確認ください。
          </div>
        )}
      </section>
    </PageChrome>
  );
}

function ContactLink({ link }: { link: JobContactLink }) {
  const className = "inline-flex h-11 items-center justify-center rounded-[8px] bg-ink px-4 text-sm font-black text-white";

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
