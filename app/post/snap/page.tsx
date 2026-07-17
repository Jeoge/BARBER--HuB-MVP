import { ArrowLeft, UserRoundPen } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupRequiredCard } from "@/components/AuthGate";
import { PageChrome } from "@/components/PageChrome";
import { getPostPermissionRedirect } from "@/lib/permissions";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";
import { SnapPostForm } from "./SnapPostForm";

type SnapPostPageProps = {
  searchParams?: Promise<{ error?: string; message?: string }>;
};

function ProfileRequiredCard() {
  return (
    <section className="px-4 pt-4">
      <div className="rounded-[10px] border border-blush/20 bg-white p-4 shadow-sm">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-blushSoft text-blush">
          <UserRoundPen aria-hidden="true" size={22} />
        </div>
        <h2 className="mt-4 text-lg font-black leading-tight text-ink">プロフィール設定後にSnap投稿できます</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
          Snapの投稿者として表示するため、先に表示名や地域を設定してください。
        </p>
        <Link href="/mypage/profile/edit" className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink text-sm font-black text-white">
          プロフィールを設定する
        </Link>
      </div>
    </section>
  );
}

export default async function SnapPostPage({ searchParams }: SnapPostPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Snap post page auth lookup failed", {
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
    console.error("Snap post page profile lookup failed", {
      userId: user.id,
      message: profileError.message,
    });
  }

  if (profileError == null) {
    const permissionRedirect = getPostPermissionRedirect(profile, "snap", "/post/snap");
    if (permissionRedirect) {
      redirect(permissionRedirect);
    }
  }

  return (
    <PageChrome>
      <section className="px-4 pt-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
          <ArrowLeft aria-hidden="true" size={17} />
          戻る
        </Link>
        <div className="mt-4 rounded-[8px] border border-blush/20 bg-white p-4 shadow-sm">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-blush">SNAP POST</p>
          <h1 className="mt-1 text-[1.5rem] font-black leading-tight text-ink">スナップ投稿</h1>
          <p className="mt-2 text-[0.86rem] font-medium leading-relaxed text-mute">
            今日の1コマ　なんでも
          </p>
        </div>
      </section>

      {profileError ? (
        <section className="px-4 pt-4">
          <div className="rounded-[10px] border border-red-200 bg-red-50 p-4 text-sm font-black leading-relaxed text-red-700">
            プロフィール情報を確認できませんでした。しばらく時間をおいて再度お試しください。
          </div>
        </section>
      ) : profile == null ? (
        <ProfileRequiredCard />
      ) : (
        <SnapPostForm
          initialRegion={profile.region}
          error={params?.error}
          posted={params?.message === "posted"}
        />
      )}
    </PageChrome>
  );
}
