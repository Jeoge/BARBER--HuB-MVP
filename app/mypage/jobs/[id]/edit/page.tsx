import Link from "next/link";
import { redirect } from "next/navigation";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { JobPostForm } from "@/app/post/job/JobPostForm";
import { pathWithParams } from "@/lib/auth/redirects";
import { getUserJobPost, isSalonJobPosterProfile } from "@/lib/supabase/jobs";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

type JobEditPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
};

export default async function JobEditPage({ params, searchParams }: JobEditPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const editPath = `/mypage/jobs/${id}/edit`;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
    redirect(pathWithParams("/login", { next: editPath, message: "求人を編集するにはログインしてください。" }));
  }

  const { profile } = await getAccountProfile(supabase, user.id);

  if (profile == null || !isSalonJobPosterProfile(profile)) {
    return (
      <PageChrome>
        <PageHeaderBlock eyebrow="JOB EDIT" title="求人を編集する" body="求人編集には店舗情報の登録が必要です。" />
        <section className="px-4 pt-5">
          <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
            <p className="text-sm font-black text-ink">求人掲載には店舗情報の登録が必要です。</p>
            <p className="mt-2 text-xs font-medium leading-relaxed text-mute">まずはマイページで店舗情報を登録してください。</p>
            <Link href="/mypage/profile/edit" className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink px-4 text-sm font-black text-white">
              店舗情報を登録する
            </Link>
          </div>
        </section>
      </PageChrome>
    );
  }

  const { job } = await getUserJobPost(supabase, user.id, id);

  if (job == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-8">
          <h1 className="text-2xl font-black text-ink">求人が見つかりません</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-mute">編集できる求人が見つからないか、すでに削除されています。</p>
          <Link href="/mypage" className="mt-5 inline-flex h-11 items-center justify-center rounded-[8px] bg-blush px-4 text-sm font-black text-white">
            マイページへ戻る
          </Link>
        </section>
      </PageChrome>
    );
  }

  return (
    <PageChrome>
      <PageHeaderBlock eyebrow="JOB EDIT" title="求人を編集する" body="掲載状態、条件、直接連絡先を更新できます。" />
      <JobPostForm profile={profile} userEmail={user.email} error={query?.error} initialJob={job} />
    </PageChrome>
  );
}
