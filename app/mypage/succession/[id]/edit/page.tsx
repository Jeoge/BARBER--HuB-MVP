import Link from "next/link";
import { redirect } from "next/navigation";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { SuccessionPostForm } from "@/app/post/succession/SuccessionPostForm";
import { pathWithParams } from "@/lib/auth/redirects";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";
import { getUserSuccessionPost } from "@/lib/supabase/succession";

type SuccessionEditPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
};

export default async function SuccessionEditPage({ params, searchParams }: SuccessionEditPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const editPath = `/mypage/succession/${id}/edit`;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
    redirect(pathWithParams("/login", { next: editPath, message: "開業・承継情報を編集するにはログインしてください。" }));
  }

  const { profile } = await getAccountProfile(supabase, user.id);

  if (profile == null) {
    return (
      <PageChrome>
        <PageHeaderBlock eyebrow="SUCCESSION EDIT" title="開業・承継情報を編集する" body="編集にはプロフィール設定が必要です。" />
        <section className="px-4 pt-5">
          <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
            <p className="text-sm font-black text-ink">プロフィールを設定してください。</p>
            <p className="mt-2 text-xs font-medium leading-relaxed text-mute">表示名や地域を設定してから編集できます。</p>
            <Link href="/mypage/profile/edit" className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink px-4 text-sm font-black text-white">
              プロフィールを設定する
            </Link>
          </div>
        </section>
      </PageChrome>
    );
  }

  const { post } = await getUserSuccessionPost(supabase, user.id, id);

  if (post == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-8">
          <h1 className="text-2xl font-black text-ink">掲載が見つかりません</h1>
          <p className="mt-3 text-sm font-medium leading-relaxed text-mute">編集できる掲載が見つからないか、すでに削除されています。</p>
          <Link href="/mypage" className="mt-5 inline-flex h-11 items-center justify-center rounded-[8px] bg-blush px-4 text-sm font-black text-white">
            マイページへ戻る
          </Link>
        </section>
      </PageChrome>
    );
  }

  return (
    <PageChrome>
      <PageHeaderBlock eyebrow="SUCCESSION EDIT" title="開業・承継情報を編集する" body="公開情報と非公開情報を分けて更新できます。" />
      <SuccessionPostForm profile={profile} error={query?.error} initialPost={post} />
    </PageChrome>
  );
}
