import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
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
  const next = params?.next ?? "/mypage";
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
          まずはメールアドレスとパスワードでアカウントを作成します。登録後にメールを確認してからログインしてください。
        </p>
      </section>

      <section className="pt-7">
        {status ? (
          <SignupStatusCard status={normalizeSignupStatus(status)} />
        ) : user ? (
          <LoggedInCard />
        ) : (
          <SignupForm next={next} error={params?.error} />
        )}
      </section>
    </main>
  );
}
