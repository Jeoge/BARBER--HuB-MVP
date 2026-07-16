import { ArrowLeft, Send, ShieldCheck, Sparkles, UserRoundPen } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupRequiredCard } from "@/components/AuthGate";
import { BackroomSetupRequiredCard } from "@/components/BackroomSetupRequiredCard";
import { PageChrome } from "@/components/PageChrome";
import { SafetyChecklistSubmit } from "@/components/SafetyChecklist";
import { pathWithParams } from "@/lib/auth/redirects";
import { backRoomTheme } from "@/lib/backRoomTheme";
import { getPostPermissionRedirect } from "@/lib/permissions";
import { BACKROOM_CATEGORIES, getBackroomProfile } from "@/lib/supabase/backroom";
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

      <form action={createBackroomPostAction} className="grid gap-4 px-4 pt-4">
        {params?.error ? (
          <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
            {params.error}
          </div>
        ) : null}

        <label className="grid gap-2">
        <span className="text-sm font-black text-ink">スレッドタイトル</span>
          <input
            name="title"
            maxLength={120}
            required
            className={"h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-bold text-ink outline-none " + backRoomTheme.focusRing}
            placeholder="例：静音バリカンでおすすめありますか？"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">カテゴリー</span>
          <select name="category" className={"h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none " + backRoomTheme.focusRing}>
            {BACKROOM_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">最初の本文</span>
          <textarea
            name="body"
            rows={9}
            maxLength={6000}
            required
            className={"resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none " + backRoomTheme.focusRing}
            placeholder="相談、経験共有、営業後トークを気軽に書いてください。"
          />
        </label>

        <div className={"rounded-[8px] p-3 text-[0.78rem] font-medium leading-relaxed text-ink " + backRoomTheme.notice}>
          タイトル・カテゴリー・本文は必須です。個人名や店舗名を出した攻撃、晒しは避けてください。企業・団体から依頼された投稿や告知を主目的とする投稿は、PR・協賛掲載として扱う場合があります。
        </div>

        <SafetyChecklistSubmit
          title="Back Room投稿前の確認"
          body="Back Roomは会員限定の営業後コミュニティです。ただし、投稿内容の外部共有やスクリーンショットを完全に防ぐことはできません。個人名、顧客情報、他店批判、内部情報、機密情報は投稿しないでください。"
          items={backroomSafetyItems}
          pendingText="作成中..."
          className={"inline-flex h-12 items-center justify-center gap-2 rounded-[8px] text-sm font-black " + backRoomTheme.primaryButton}
        >
          <Send aria-hidden="true" size={17} />
          スレッドを作成
        </SafetyChecklistSubmit>
      </form>
    </PageChrome>
  );
}
