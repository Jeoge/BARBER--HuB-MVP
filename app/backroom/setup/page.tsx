import { ArrowLeft, LockKeyhole, Save, UserRoundPlus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoadingSubmitButton } from "@/components/LoadingButton";
import { PageChrome } from "@/components/PageChrome";
import { pathWithParams, safeNextPath } from "@/lib/auth/redirects";
import { getBackroomProfile } from "@/lib/supabase/backroom";
import { createClient } from "@/lib/supabase/server";
import { saveBackroomProfileAction } from "./actions";

type BackroomSetupPageProps = {
  searchParams?: Promise<{ error?: string; next?: string }>;
};

export default async function BackroomSetupPage({ searchParams }: BackroomSetupPageProps) {
  const params = await searchParams;
  const next = safeNextPath(params?.next, "/backroom");
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Back Room setup page auth lookup failed", {
        message: userError.message,
      });
    }

    redirect(pathWithParams("/login", { next: pathWithParams("/backroom/setup", { next }), message: "Back Room参加設定にはログインしてください。" }));
  }

  const { profile, error } = await getBackroomProfile(supabase, user.id);

  return (
    <PageChrome>
      <section className="px-4 pt-4">
        <Link href="/backroom" className="inline-flex items-center gap-1.5 text-sm font-black text-ink transition active:scale-[0.98]">
          <ArrowLeft aria-hidden="true" size={17} />
          Back Roomへ戻る
        </Link>
        <div className="mt-4 rounded-[10px] border border-blush/20 bg-white p-4 shadow-sm">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-blushSoft text-blush ring-4 ring-blush/10">
            <LockKeyhole aria-hidden="true" size={24} />
          </div>
          <p className="mt-3 text-[0.68rem] font-black uppercase tracking-[0.14em] text-blush">BACK ROOM SETUP</p>
          <h1 className="mt-1 text-[1.5rem] font-black leading-tight text-ink">Back Room参加設定</h1>
          <p className="mt-2 text-[0.86rem] font-medium leading-relaxed text-mute">
            Back Roomでは、通常プロフィールとは別のニックネームで参加できます。
          </p>
          <div className="mt-3 flex items-start gap-2 rounded-[8px] bg-blushSoft p-3">
            <UserRoundPlus aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-blush" />
            <p className="text-[0.78rem] font-black leading-relaxed text-ink">
              ニックネームを設定すると、カテゴリー内のスレッド一覧、詳細、コメントが見られるようになります。
            </p>
          </div>
        </div>
      </section>

      <form action={saveBackroomProfileAction} className="grid gap-4 px-4 pt-4">
        <input type="hidden" name="next" value={next} />
        {params?.error ? (
          <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
            {params.error}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
            既存のBack Room参加設定を読み込めませんでした。保存すると、新しい設定として保存します。
          </div>
        ) : null}
        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">Back Room専用ニックネーム</span>
          <input
            name="nickname"
            type="text"
            required
            maxLength={20}
            defaultValue={profile?.nickname ?? ""}
            placeholder="例：営業後の理容師"
            className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-bold text-ink outline-none focus:border-blush"
          />
          <span className="text-[0.68rem] font-semibold leading-relaxed text-mute">20文字以内。通常プロフィールの表示名や店舗名とは別に保存されます。</span>
        </label>
        <LoadingSubmitButton
          pendingText="保存中..."
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-ink text-sm font-black text-white"
        >
          <Save aria-hidden="true" size={17} />
          保存してBack Roomへ
        </LoadingSubmitButton>
      </form>
    </PageChrome>
  );
}
