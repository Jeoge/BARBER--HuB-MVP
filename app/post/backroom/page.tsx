import { ArrowLeft, ShieldCheck, Sparkles, UserRoundPen } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupRequiredCard } from "@/components/AuthGate";
import { BackroomPostForm } from "@/components/BackroomPostForm";
import { BackroomSetupRequiredCard } from "@/components/BackroomSetupRequiredCard";
import { PageChrome } from "@/components/PageChrome";
import { pathWithParams } from "@/lib/auth/redirects";
import { backRoomTheme } from "@/lib/backRoomTheme";
import { getPostPermissionRedirect } from "@/lib/permissions";
import { getBackroomProfile } from "@/lib/supabase/backroom";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";
import { createBackroomPostAction } from "./actions";

const backroomSafetyItems = [
  {
    name: "backroomPrivacyConfirmed",
    label: "個人・店舗・顧客が特定される情報は含めていません。",
  },
  {
    name: "backroomScopeConfirmed",
    label: "会員限定でも外部に伝わる可能性があることを理解しています。",
  },
];

type BackroomPostPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

function ProfileRequiredCard() {
  return (
    <section className="px-4 pt-4">
      <div className={"rounded-[10px] border bg-white p-4 " + backRoomTheme.threadCard}>
        <div className={"grid h-11 w-11 place-items-center rounded-full " + backRoomTheme.iconSurface}>
          <UserRoundPen aria-hidden="true" size={22} />
        </div>
        <h2 className="mt-4 text-lg font-black leading-tight text-ink">プロフィール設定後にBack Roomへ投稿できます</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-mute">投稿者として表示するため、先に表示名や地域を設定してください。</p>
        <Link href="/mypage/profile/edit" className={"mt-4 inline-flex h-11 w-full items-center justify-center rounded-[8px] text-sm font-black " + backRoomTheme.primaryButton}>
          プロフィールを設定する
        </Link>
      </div>
    </section>
  );
}

export default async function BackroomPostPage({ searchParams }: BackroomPostPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Back Room post page auth lookup failed", {
        message: userError.message,
      });
    }

    return (
      <PageChrome variant="backroom">
        <section className="px-4 pt-4">
          <Link href="/backroom" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
            <ArrowLeft aria-hidden="true" size={17} />
            Back Roomへ戻る
          </Link>
        </section>
        <SignupRequiredCard kind="backyard" />
      </PageChrome>
    );
  }

  const { profile, error: profileError } = await getAccountProfile(supabase, user.id);

  if (profileError) {
    console.error("Back Room post page profile lookup failed", {
      userId: user.id,
      message: profileError.message,
    });
  }

  if (profileError == null && profile == null) {
    return (
      <PageChrome variant="backroom">
        <section className="px-4 pt-4">
          <Link href="/backroom" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
            <ArrowLeft aria-hidden="true" size={17} />
            Back Roomへ戻る
          </Link>
        </section>
        <ProfileRequiredCard />
      </PageChrome>
    );
  }

  if (profileError) {
    redirect(pathWithParams("/mypage/profile/edit", { error: "プロフィール情報を確認できませんでした。保存後にBack Room投稿をお試しください。" }));
  }

  const permissionRedirect = getPostPermissionRedirect(profile, "backroom", "/post/backroom");
  if (permissionRedirect) {
    redirect(permissionRedirect);
  }

  const { profile: backroomProfile } = await getBackroomProfile(supabase, user.id);

  if (backroomProfile == null) {
    return (
      <PageChrome variant="backroom">
        <section className="px-4 pt-4">
          <Link href="/backroom" className="inline-flex items-center gap-1.5 text-sm font-black text-ink transition active:scale-[0.98]">
            <ArrowLeft aria-hidden="true" size={17} />
            Back Roomへ戻る
          </Link>
        </section>
        <BackroomSetupRequiredCard next="/post/backroom" />
      </PageChrome>
    );
  }

  return (
    <PageChrome variant="backroom">
      <section className="px-4 pt-4">
        <Link href="/backroom" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
          <ArrowLeft aria-hidden="true" size={17} />
          Back Roomへ戻る
        </Link>
        <div className={"mt-4 rounded-[8px] border bg-white p-4 " + backRoomTheme.threadCard}>
          <div className={"grid h-11 w-11 place-items-center rounded-full " + backRoomTheme.iconSurface}>
            <ShieldCheck aria-hidden="true" size={22} />
          </div>
          <p className={"mt-3 text-[0.68rem] font-black uppercase tracking-[0.14em] " + backRoomTheme.accentText}>BACK ROOM THREAD</p>
          <h1 className="mt-1 text-[1.5rem] font-black leading-tight text-ink">スレッドを立てる</h1>
          <p className="mt-2 text-[0.86rem] font-medium leading-relaxed text-mute">
            カテゴリーを選んで、営業後に話したい相談や雑談のスレッドを立てられます。
          </p>
          <div className={"mt-3 flex items-start gap-2 rounded-[8px] p-3 " + backRoomTheme.notice}>
            <Sparkles aria-hidden="true" size={17} className={"mt-0.5 shrink-0 " + backRoomTheme.accentText} />
            <p className="text-[0.78rem] font-black leading-relaxed text-ink">経営、技術、独立、スタッフ、集客、STU、アシスタント、趣味の話を気軽にどうぞ。</p>
          </div>
        </div>
      </section>

      <BackroomPostForm action={createBackroomPostAction} error={params?.error} safetyItems={backroomSafetyItems} />
    </PageChrome>
  );
}
