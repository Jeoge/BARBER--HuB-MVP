import { ArrowLeft, FilePenLine, Sparkles, UserRoundPen } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupRequiredCard } from "@/components/AuthGate";
import { PageChrome } from "@/components/PageChrome";
import { defaultArticleCategory } from "@/lib/articleCategories";
import { pathWithParams } from "@/lib/auth/redirects";
import { isNewsReviewAdminUserId } from "@/lib/news-drafts/review";
import { getPostPermissionRedirect } from "@/lib/permissions";
import { isMonetizationEnabled } from "@/lib/monetization";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";
import { ArticlePostForm } from "./ArticlePostForm";

type ArticlePostPageProps = {
  searchParams?: Promise<{ error?: string; category?: string; type?: string }>;
};

function ProfileRequiredCard() {
  return (
    <section className="px-4 pt-4">
      <div className="rounded-[10px] border border-blush/20 bg-white p-4 shadow-sm">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-blushSoft text-blush">
          <UserRoundPen aria-hidden="true" size={22} />
        </div>
        <h2 className="mt-4 text-lg font-black leading-tight text-ink">プロフィール設定後に記事投稿できます</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
          投稿者として表示するため、先に表示名や地域を設定してください。
        </p>
        <Link href="/mypage/profile/edit" className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink text-sm font-black text-white">
          プロフィールを設定する
        </Link>
      </div>
    </section>
  );
}

export default async function ArticlePostPage({ searchParams }: ArticlePostPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Article post page auth lookup failed", {
        message: userError.message,
      });
    }

    return (
      <PageChrome>
        <section className="px-4 pt-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
            <ArrowLeft aria-hidden="true" size={17} />
            戻る
          </Link>
        </section>
        <SignupRequiredCard />
      </PageChrome>
    );
  }

  const { profile, error: profileError } = await getAccountProfile(supabase, user.id);

  if (profileError) {
    console.error("Article post page profile lookup failed", {
      userId: user.id,
      message: profileError.message,
    });
  }

  if (profileError == null && profile == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
            <ArrowLeft aria-hidden="true" size={17} />
            戻る
          </Link>
        </section>
        <ProfileRequiredCard />
      </PageChrome>
    );
  }

  if (profileError) {
    redirect(pathWithParams("/mypage/profile/edit", { error: "プロフィール情報を確認できませんでした。保存後に記事投稿をお試しください。" }));
  }

  const defaultCategory = defaultArticleCategory(params?.category, params?.type);
  const capability = defaultCategory === "講習会レポート" || defaultCategory === "コンクールレポート" ? "report" : "article";
  const permissionRedirect = getPostPermissionRedirect(profile, capability, "/post/article");
  if (permissionRedirect) {
    redirect(permissionRedirect);
  }
  const canSetEditorPick = isNewsReviewAdminUserId(user.id);

  return (
    <PageChrome>
      <section className="px-4 pt-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
          <ArrowLeft aria-hidden="true" size={17} />
          戻る
        </Link>
        <div className="mt-4 rounded-[8px] border border-blush/20 bg-white p-4 shadow-sm">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-blushSoft text-blush">
            <FilePenLine aria-hidden="true" size={22} />
          </div>
          <p className="mt-3 text-[0.68rem] font-black uppercase tracking-[0.14em] text-blush">ARTICLE POST</p>
          <h1 className="mt-1 text-[1.5rem] font-black leading-tight text-ink">経験記事を書く</h1>
          <p className="mt-2 text-[0.86rem] font-medium leading-relaxed text-mute">
            あなたの実体験を、経営・技術・集客のヒントとして投稿できます。
          </p>
          <div className="mt-3 flex items-start gap-2 rounded-[8px] bg-blushSoft p-3">
            <Sparkles aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-blush" />
            <p className="text-[0.78rem] font-black leading-relaxed text-ink">
              うまくいった話も、途中の試行錯誤も価値になります。
            </p>
          </div>
        </div>
      </section>

        <ArticlePostForm defaultCategory={defaultCategory} error={params?.error} canSetEditorPick={canSetEditorPick} paidPublishingEnabled={isMonetizationEnabled()} />
    </PageChrome>
  );
}
