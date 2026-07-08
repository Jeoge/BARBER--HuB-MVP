import Link from "next/link";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { pathWithParams } from "@/lib/auth/redirects";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";
import { SuccessionPostForm } from "./SuccessionPostForm";

type SuccessionPostPageProps = {
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
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">SUCCESSION ACCESS</p>
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

export default async function SuccessionPostPage({ searchParams }: SuccessionPostPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
    return (
      <PageChrome>
        <PageHeaderBlock
          eyebrow="SUCCESSION POST"
          title="開業・承継情報を掲載する"
          body="掲載にはログインが必要です。公開情報と非公開情報を分けて保存します。"
        />
        <AccessCard
          title="ログインしてください"
          body="店舗オーナー、承継希望者、開業希望者など、開業・承継に関する情報を掲載できます。"
          primaryHref={pathWithParams("/login", { next: "/post/succession", message: "開業・承継情報の掲載にはログインしてください。" })}
          primaryLabel="ログインする"
          secondaryHref={pathWithParams("/signup", { next: "/post/succession" })}
          secondaryLabel="無料で会員登録する"
        />
      </PageChrome>
    );
  }

  const { profile, error: profileError } = await getAccountProfile(supabase, user.id);

  if (profileError) {
    return (
      <PageChrome>
        <PageHeaderBlock eyebrow="SUCCESSION POST" title="開業・承継情報を掲載する" body="プロフィール情報を確認できませんでした。" />
        <AccessCard
          title="プロフィール確認に失敗しました"
          body="時間をおいて再読み込みしてください。SQL未適用の場合は、profiles関連のmigrationも確認してください。"
          primaryHref="/mypage"
          primaryLabel="マイページへ"
        />
      </PageChrome>
    );
  }

  if (profile == null) {
    return (
      <PageChrome>
        <PageHeaderBlock
          eyebrow="SUCCESSION POST"
          title="開業・承継情報を掲載する"
          body="掲載にはプロフィール設定が必要です。"
        />
        <AccessCard
          title="プロフィールを設定してください"
          body="表示名や地域を設定してから、開業・承継情報を掲載できます。"
          primaryHref="/mypage/profile/edit"
          primaryLabel="プロフィールを設定する"
          secondaryHref="/succession"
          secondaryLabel="一覧を見る"
        />
      </PageChrome>
    );
  }

  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="SUCCESSION POST"
        title="開業・承継情報を掲載する"
        body="公開情報と非公開情報を分け、個人や店舗が特定されない形で掲載します。"
      />
      <SuccessionPostForm profile={profile} error={params?.error} />
    </PageChrome>
  );
}
