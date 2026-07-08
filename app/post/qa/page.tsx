import { ArrowLeft, HelpCircle, Send, Sparkles, UserRoundPen } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupRequiredCard } from "@/components/AuthGate";
import { PageChrome } from "@/components/PageChrome";
import { SafetyChecklistSubmit } from "@/components/SafetyChecklist";
import { pathWithParams } from "@/lib/auth/redirects";
import { getPostPermissionRedirect } from "@/lib/permissions";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { QA_CATEGORIES } from "@/lib/supabase/qa";
import { createClient } from "@/lib/supabase/server";
import { createQaQuestionAction } from "./actions";

const qaSafetyItems = [
  {
    name: "qaPrivacyConfirmed",
    label: "個人・店舗が特定される情報は含めていません。",
  },
];

type QaPostPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

function ProfileRequiredCard() {
  return (
    <section className="px-4 pt-4">
      <div className="rounded-[10px] border border-blush/20 bg-white p-4 shadow-sm">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-blushSoft text-blush">
          <UserRoundPen aria-hidden="true" size={22} />
        </div>
        <h2 className="mt-4 text-lg font-black leading-tight text-ink">プロフィール設定後に質問できます</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-mute">質問者として表示するため、先に表示名や地域を設定してください。</p>
        <Link href="/mypage/profile/edit" className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink text-sm font-black text-white">
          プロフィールを設定する
        </Link>
      </div>
    </section>
  );
}

export default async function QaPostPage({ searchParams }: QaPostPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Q&A post page auth lookup failed", {
        message: userError.message,
      });
    }

    return (
      <PageChrome>
        <section className="px-4 pt-4">
          <Link href="/qa" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
            <ArrowLeft aria-hidden="true" size={17} />
            Q&Aへ戻る
          </Link>
        </section>
        <SignupRequiredCard />
      </PageChrome>
    );
  }

  const { profile, error: profileError } = await getAccountProfile(supabase, user.id);

  if (profileError) {
    console.error("Q&A post page profile lookup failed", {
      userId: user.id,
      userEmail: user.email ?? null,
      message: profileError.message,
    });
  }

  if (profileError == null && profile == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-4">
          <Link href="/qa" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
            <ArrowLeft aria-hidden="true" size={17} />
            Q&Aへ戻る
          </Link>
        </section>
        <ProfileRequiredCard />
      </PageChrome>
    );
  }

  if (profileError) {
    redirect(pathWithParams("/mypage/profile/edit", { error: "プロフィール情報を確認できませんでした。保存後に質問投稿をお試しください。" }));
  }

  const permissionRedirect = getPostPermissionRedirect(profile, "qa", "/post/qa");
  if (permissionRedirect) {
    redirect(permissionRedirect);
  }

  return (
    <PageChrome>
      <section className="px-4 pt-4">
        <Link href="/qa" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
          <ArrowLeft aria-hidden="true" size={17} />
          Q&Aへ戻る
        </Link>
        <div className="mt-4 rounded-[8px] border border-blush/20 bg-white p-4 shadow-sm">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-blushSoft text-blush">
            <HelpCircle aria-hidden="true" size={22} />
          </div>
          <p className="mt-3 text-[0.68rem] font-black uppercase tracking-[0.14em] text-blush">Q&A POST</p>
          <h1 className="mt-1 text-[1.5rem] font-black leading-tight text-ink">Q&Aで相談する</h1>
          <p className="mt-2 text-[0.86rem] font-medium leading-relaxed text-mute">
            理美容師の困りごと相談。技術・経営・集客・独立の疑問を、業界の経験で解決する場所です。
          </p>
          <div className="mt-3 flex items-start gap-2 rounded-[8px] bg-blushSoft p-3">
            <Sparkles aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-blush" />
            <p className="text-[0.78rem] font-black leading-relaxed text-ink">困っている状況、試したこと、聞きたいことをそのまま書いてください。</p>
          </div>
        </div>
      </section>

      <form action={createQaQuestionAction} className="grid gap-4 px-4 pt-4">
        {params?.error ? (
          <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
            {params.error}
          </div>
        ) : null}

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">質問タイトル</span>
          <input
            name="title"
            maxLength={120}
            required
            className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-bold text-ink outline-none focus:border-blush"
            placeholder="例：値上げを常連のお客様にどう伝えていますか？"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">カテゴリー</span>
          <select name="category" className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush">
            {QA_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">詳しい内容</span>
          <textarea
            name="body"
            rows={9}
            maxLength={6000}
            required
            className="resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush"
            placeholder="困っている状況、試したこと、聞きたいことを書いてください。"
          />
        </label>

        <div className="rounded-[8px] border border-line/80 bg-neutral-50 px-3 py-2.5 text-[0.72rem] font-medium leading-relaxed text-mute">
          企業・団体から依頼された質問、告知・販売・募集を主目的とする内容は、通常Q&Aではなく広告掲載・協賛の問い合わせとして扱う場合があります。
        </div>

        <SafetyChecklistSubmit
          title="Q&A投稿前の確認"
          body="Q&Aは、理美容の仕事で困ったことを相談する場所です。お客様名、スタッフ名、他店名など、個人や店舗が特定される情報は書かないでください。法律・税務・医療・労務など専門判断が必要な内容は、最終的に専門家へ確認してください。"
          items={qaSafetyItems}
          pendingText="投稿中..."
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-blush text-sm font-black text-white"
        >
          <Send aria-hidden="true" size={17} />
          質問を投稿する
        </SafetyChecklistSubmit>
      </form>
    </PageChrome>
  );
}
