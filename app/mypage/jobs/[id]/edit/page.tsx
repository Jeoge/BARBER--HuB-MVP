import Link from "next/link";
import { redirect } from "next/navigation";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { JobPostForm } from "@/app/post/job/JobPostForm";
import { pathWithParams } from "@/lib/auth/redirects";
import { listOwnedVerifiedBarberShops, shopAreaLabel } from "@/lib/supabase/barber-shops";
import { getUserJobPost } from "@/lib/supabase/jobs";
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

  const [{ profile }, { shops: verifiedShops }] = await Promise.all([
    getAccountProfile(supabase, user.id),
    listOwnedVerifiedBarberShops(supabase, user.id, 1),
  ]);

  if (verifiedShops.length === 0) {
    return (
      <PageChrome>
        <PageHeaderBlock eyebrow="JOB EDIT" title="求人を編集する" body="求人編集には認証済み店舗に紐づいたサロン機能が必要です。" />
        <section className="px-4 pt-5">
          <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
            <p className="text-sm font-black text-ink">サロン機能を追加してください。</p>
            <p className="mt-2 text-xs font-medium leading-relaxed text-mute">プロフィール区分だけでは求人編集はできません。店舗確認が完了すると利用できます。</p>
            <Link href="/?storeDirectory=1" className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink px-4 text-sm font-black text-white">
              サロン機能を追加する
            </Link>
          </div>
        </section>
      </PageChrome>
    );
  }

  if (profile == null) {
    return (
      <PageChrome>
        <PageHeaderBlock eyebrow="JOB EDIT" title="求人を編集する" body="求人編集にはプロフィール設定が必要です。" />
        <section className="px-4 pt-5">
          <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
            <p className="text-sm font-black text-ink">プロフィールを設定してください。</p>
            <p className="mt-2 text-xs font-medium leading-relaxed text-mute">表示名や連絡先の初期値を確認してから編集できます。</p>
            <Link href="/mypage/profile/edit" className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink px-4 text-sm font-black text-white">
              プロフィールを設定する
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

  const defaultShop = verifiedShops[0];
  const formProfile = {
    ...profile,
    salon_name: profile.salon_name ?? defaultShop.name,
    shop_address: profile.shop_address ?? defaultShop.address,
    region: profile.region ?? shopAreaLabel(defaultShop),
  };

  return (
    <PageChrome>
      <PageHeaderBlock eyebrow="JOB EDIT" title="求人を編集する" body="掲載状態、条件、直接連絡先を更新できます。" />
      <JobPostForm profile={formProfile} userEmail={user.email} error={query?.error} initialJob={job} />
    </PageChrome>
  );
}
