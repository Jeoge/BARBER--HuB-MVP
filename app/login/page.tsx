import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export default function LoginPage() {
  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-white px-4 pb-12 pt-6 shadow-[0_0_80px_rgba(17,17,17,0.08)]">
      <BrandLogo />
      <section className="pt-10">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.14em] text-blush">LOGIN</p>
        <h1 className="mt-2 text-[2rem] font-black leading-tight text-ink">ログイン</h1>
        <p className="mt-3 text-sm font-medium leading-relaxed text-mute">
          会員になると、投稿・THANKS・Back Room・求人登録が使えるようになります。
        </p>
      </section>

      <section className="grid gap-4 pt-7">
        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">メールアドレス</span>
          <input className="h-12 rounded-[8px] border border-line px-3 text-sm font-bold outline-none focus:border-blush" type="email" placeholder="example@barberhub.jp" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">パスワード</span>
          <input className="h-12 rounded-[8px] border border-line px-3 text-sm font-bold outline-none focus:border-blush" type="password" placeholder="パスワード" />
        </label>
        <button className="h-12 rounded-[8px] bg-blush text-sm font-black text-white">ログイン</button>
        <Link href="/signup" className="h-11 rounded-[8px] border border-line text-center text-sm font-black leading-[2.75rem] text-ink">
          会員登録はこちら
        </Link>
        <button className="text-center text-xs font-bold text-mute">パスワードを忘れた方</button>
      </section>
    </main>
  );
}
