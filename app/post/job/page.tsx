import Link from "next/link";
import { redirect } from "next/navigation";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { pathWithParams } from "@/lib/auth/redirects";
import { getPostPermissionRedirect } from "@/lib/permissions";
import { isSalonJobPosterProfile } from "@/lib/supabase/jobs";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";
import { JobPostForm } from "./JobPostForm";

type JobPostPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

function AccessCard({
  title,
  body,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="px-4 pt-5">
      <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">JOB ACCESS</p>
        <h2 className="mt-2 text-lg font-black leading-tight text-ink">{title}</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-mute">{body}</p>
        <Link href={primaryHref} className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink px-4 text-sm font-black text-white">
          {primaryLabel}
        </Link>
        {secondaryHref && secondaryLabel ? (
          <Link href={secondaryHref} className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-[8px] border border-line bg-white px-4 text-sm font-black text-ink">
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export default async function JobPostPage({ searchParams }: JobPostPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
    return (
      <PageChrome>
        <PageHeaderBlock
          eyebrow="JOB REGISTER"
          title="求人を掲載する"
          body="求人掲載は基本無料です。掲載を始めるにはログインしてください。"
        />
        <AccessCard
          title="求人掲載には会員登録が必要です"
          body="BARBER HUBでは、店舗情報が登録されたサロンだけが求人を掲載できます。ログイン後に店舗情報を確認します。"
          primaryHref={pathWithParams("/login", { next: "/post/job", message: "求人掲載にはログインしてください。" })}
          primaryLabel="ログインする"
          secondaryHref={pathWithParams("/signup", { next: "/post/job" })}
          secondaryLabel="無料で会員登録する"
        />
      </PageChrome>
    );
  }

  const { profile, error: profileError } = await getAccountProfile(supabase, user.id);

  if (profileError) {
    return (
      <PageChrome>
        <PageHeaderBlock eyebrow="JOB REGISTER" title="求人を掲載する" body="プロフィール情報を確認できませんでした。" />
        <AccessCard
          title="プロフィール確認に失敗しました"
          body="時間をおいて再読み込みしてください。"
          primaryHref="/mypage"
          primaryLabel="マイページへ"
        />
      </PageChrome>
    );
  }

  const permissionRedirect = getPostPermissionRedirect(profile, "job", "/post/job");
  if (permissionRedirect) {
    redirect(permissionRedirect);
  }

  if (profile == null || !isSalonJobPosterProfile(profile)) {
    return (
      <PageChrome>
        <PageHeaderBlock
          eyebrow="JOB REGISTER"
          title="求人を掲載する"
          body="求人掲載には、店舗名・店舗住所などの店舗情報登録が必要です。"
        />
        {params?.error ? (
          <section className="px-4 pt-4">
            <div className="rounded-[10px] border border-red-200 bg-red-50 p-4 text-sm font-black leading-relaxed text-red-700">
              {params.error}
            </div>
          </section>
        ) : null}
        <AccessCard
          title="求人掲載には店舗情報の登録が必要です"
          body="まずはマイページでサロン名、店舗住所、職種などを登録してください。通常会員のままでは求人掲載はできません。"
          primaryHref="/mypage/profile/edit"
          primaryLabel="店舗情報を登録する"
          secondaryHref="/jobs"
          secondaryLabel="求人一覧を見る"
        />
      </PageChrome>
    );
  }

  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="JOB REGISTER"
        title="求人を掲載する"
        body="まずは無料で、あなたのサロンの求人をBARBER HUBに掲載できます。"
      />
      <JobPostForm profile={profile} userEmail={user.email} error={params?.error} />
    </PageChrome>
  );
}
