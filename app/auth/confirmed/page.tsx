import { AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { pathWithParams, safeNextPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";
import { openBarberHubAfterConfirmation } from "./actions";
import { OpenBarberHubSubmitButton } from "./OpenBarberHubSubmitButton";

type AuthConfirmedPageProps = {
  searchParams?: Promise<{ next?: string; status?: string }>;
};

export default async function AuthConfirmedPage({ searchParams }: AuthConfirmedPageProps) {
  const params = await searchParams;
  const next = safeNextPath(params?.next, "/");
  const callbackFailed = params?.status === "error";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const hasUser = Boolean(user);
  const callbackFailedWithoutSession = callbackFailed && !hasUser;
  const isSuccess = hasUser;

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-white px-4 pb-12 pt-6 shadow-[0_0_80px_rgba(17,17,17,0.08)]">
      <BrandLogo />

      <section className="pt-10">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.14em] text-blush">EMAIL VERIFIED</p>
        <h1 className="mt-2 text-[2rem] font-black leading-tight text-ink">メール確認</h1>
      </section>

      <section className="pt-7">
        <div className="rounded-[10px] border border-blush/20 bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.04)]">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-blushSoft text-blush">
            {isSuccess ? <CheckCircle2 aria-hidden="true" size={22} /> : <AlertCircle aria-hidden="true" size={22} />}
          </div>

          <h2 className="mt-4 text-xl font-black leading-tight text-ink">
            {isSuccess ? "メール確認が完了しました。" : callbackFailedWithoutSession ? "メール確認を完了できませんでした。" : "ログイン状態を確認できませんでした。"}
          </h2>

          {isSuccess ? (
            <div className="mt-3 grid gap-2 text-sm font-medium leading-relaxed text-mute">
              <p>このままBARBER HUBを開けます。</p>
              <p>メールアプリ内ブラウザで開いた場合も、このボタンから進んでください。</p>
            </div>
          ) : callbackFailedWithoutSession ? (
            <div className="mt-3 grid gap-2 text-sm font-medium leading-relaxed text-mute">
              <p>確認リンクは期限切れ、使用済み、またはすでに開かれている可能性があります。</p>
              <p>メール確認済みの場合はログインしてください。</p>
            </div>
          ) : (
            <div className="mt-3 grid gap-2 text-sm font-medium leading-relaxed text-mute">
              <p>ログイン状態を確認できませんでした。</p>
              <p>メール確認済みの場合はログインしてBARBER HUBを開いてください。</p>
            </div>
          )}

          {isSuccess ? (
            <form action={openBarberHubAfterConfirmation} className="mt-5">
              <input type="hidden" name="next" value={next} />
              <OpenBarberHubSubmitButton />
            </form>
          ) : callbackFailedWithoutSession ? (
            <Link
              href={pathWithParams("/login", {
                next,
                message: "確認リンクは使用済み、または期限切れの可能性があります。メール確認済みの場合はログインしてください。",
              })}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink text-sm font-black text-white transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blush"
            >
              ログインして開く
            </Link>
          ) : (
            <Link
              href={pathWithParams("/login", {
                next,
                message: "ログイン状態を確認できませんでした。メール確認済みの場合はログインしてBARBER HUBを開いてください。",
              })}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink text-sm font-black text-white transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blush"
            >
              ログインして開く
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
