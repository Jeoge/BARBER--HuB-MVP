import { BrandLogo } from "@/components/BrandLogo";
import { safeNextPath } from "@/lib/auth/redirects";
import { normalizeSignupStatus, SignupStatusCard } from "../SignupStatusCard";

type SignupCompletePageProps = {
  searchParams?: Promise<{ next?: string; status?: string }>;
};

export default async function SignupCompletePage({ searchParams }: SignupCompletePageProps) {
  const params = await searchParams;
  const status = normalizeSignupStatus(params?.status);
  const next = safeNextPath(params?.next, "/");

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-white px-4 pb-12 pt-6 shadow-[0_0_80px_rgba(17,17,17,0.08)]">
      <BrandLogo />

      <section className="pt-10">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.14em] text-blush">SIGN UP</p>
        <h1 className="mt-2 text-[2rem] font-black leading-tight text-ink">会員登録</h1>
      </section>

      <section className="pt-7">
        <SignupStatusCard status={status} next={next} />
      </section>
    </main>
  );
}
