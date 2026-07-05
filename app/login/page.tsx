import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { loginAction } from "./actions";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string; message?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = params?.next ?? "/mypage";

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-white px-4 pb-12 pt-6 shadow-[0_0_80px_rgba(17,17,17,0.08)]">
      <BrandLogo />
      <section className="pt-10">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.14em] text-blush">LOGIN</p>
        <h1 className="mt-2 text-[2rem] font-black leading-tight text-ink">ログイン</h1>
        <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
          会員になると、投稿・Thanks・Back Room・求人登録が使えるようになります。
        </p>
      </section>

      <form action={loginAction} className="grid gap-4 pt-7">
        <input type="hidden" name="next" value={next} />
        {params?.message ? (
          <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-sm font-black leading-relaxed text-ink">
            {params.message}
          </div>
        ) : null}
        {params?.error ? (
          <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
            {params.error}
          </div>
        ) : null}
        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">メールアドレス</span>
          <input name="email" className="h-12 rounded-[8px] border border-line px-3 text-sm font-bold outline-none focus:border-blush" type="email" placeholder="example@barberhub.jp" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">パスワード</span>
          <input name="password" className="h-12 rounded-[8px] border border-line px-3 text-sm font-bold outline-none focus:border-blush" type="password" placeholder="パスワード" />
        </label>
        <button type="submit" className="h-12 rounded-[8px] bg-blush text-sm font-black text-white">ログイン</button>
        <Link href="/signup" className="h-11 rounded-[8px] border border-line text-center text-sm font-black leading-[2.75rem] text-ink">
          会員登録はこちら
        </Link>
        <button type="button" className="text-center text-xs font-bold text-mute">パスワードを忘れた方</button>
      </form>
    </main>
  );
}
