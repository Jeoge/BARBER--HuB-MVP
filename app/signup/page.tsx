import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { safeNextPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "./SignupForm";
import { normalizeSignupStatus, SignupStatusCard } from "./SignupStatusCard";

type SignupPageProps = {
  searchParams?: Promise<{ error?: string; message?: string; next?: string; status?: string }>;
};

function LoggedInCard() {
  return (
    <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.04)]">
      <h2 className="text-xl font-black leading-tight text-ink">すでにログインしています。</h2>
      <p className="mt-2 text-sm font-medium leading-relaxed text-mute">会員登録フォームは表示せず、マイページへ進めます。</p>
      <Link href="/mypage" className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink text-sm font-black text-white">
        マイページへ進む
      </Link>
    </div>
  );
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const next = safeNextPath(params?.next, "/");
  const status = params?.status ?? (params?.message === "signup-sent" ? "check-email" : undefined);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-white px-4 pb-12 pt-6 shadow-[0_0_80px_rgba(17,17,17,0.08)]">
      <BrandLogo />

      <section className="pt-10">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.14em] text-blush">SIGN UP</p>
        <h1 className="mt-2 text-[2rem] font-black leading-tight text-ink">会員登録</h1>
        <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
          まずは個人アカウントで気軽に参加できます。Snap、記事、Back Room、Q&Aの利用に店舗登録は必要ありません。求人や店舗管理などを利用する場合は、登録後にマイページから店舗機能を追加できます。
        </p>
      </section>

      <section className="pt-7">
        {status ? (
          <SignupStatusCard status={normalizeSignupStatus(status)} next={next} />
        ) : user ? (
          <LoggedInCard />
        ) : (
          <SignupForm next={next} error={params?.error} />
        )}
      </section>
    </main>
  );
}
