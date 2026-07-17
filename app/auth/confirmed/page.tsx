import { AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { pathWithParams, safeNextPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";
import { openBarberHubAfterConfirmation } from "./actions";

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
  const sessionMissing = !callbackFailed && !user;
  const isSuccess = !callbackFailed && !sessionMissing;

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
            {isSuccess ? "メール確認が完了しました。" : callbackFailed ? "メール確認を完了できませんでした。" : "ログイン状態を確認できませんでした。"}
          </h2>

          {isSuccess ? (
            <div className="mt-3 grid gap-2 text-sm font-medium leading-relaxed text-mute">
              <p>このままBARBER HUBを開けます。</p>
              <p>メールアプリ内ブラウザで開いた場合も、このボタンから進んでください。</p>
            </div>
          ) : callbackFailed ? (
            <div className="mt-3 grid gap-2 text-sm font-medium leading-relaxed text-mute">
              <p>確認リンクの期限切れ、またはすでに使用済みの可能性があります。</p>
              <p>もう一度登録画面から確認してください。</p>
            </div>
          ) : (
            <div className="mt-3 grid gap-2 text-sm font-medium leading-relaxed text-mute">
              <p>メール確認は完了している可能性があります。</p>
              <p>別のブラウザで開いた場合は、ログイン状態が引き継がれないことがあります。</p>
            </div>
          )}

          {isSuccess ? (
            <form action={openBarberHubAfterConfirmation} className="mt-5">
              <input type="hidden" name="next" value={next} />
              <button type="submit" className="inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink text-sm font-black text-white">
                BARBER HUBを開く
              </button>
            </form>
          ) : callbackFailed ? (
            <Link href={pathWithParams("/signup", { next })} className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink text-sm font-black text-white">
              会員登録画面へ戻る
            </Link>
          ) : (
            <Link
              href={pathWithParams("/login", {
                next,
                message: "メール確認は完了しています。このブラウザでログイン状態を確認できなかったため、ログインしてください。",
              })}
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink text-sm font-black text-white"
            >
              ログインして開く
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
