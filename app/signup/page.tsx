import { CheckCircle2, ImagePlus, LockKeyhole, Sparkles } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

const benefits = [
  "毎朝3分で業界の動きがわかる",
  "経験を共有するとTHANKSが届く",
  "スナップ投稿・Q&A・Back Roomが使える",
  "求人や講習会情報を受け取れる",
  "得意技術や地域に合わせて情報が届く",
];

const signupBenefits = benefits.map((benefit, index) => (index === 1 ? "thanksポイントを貯めて商品と交換" : benefit));

const memberTypes = ["理容師", "理容学生", "サロンオーナー", "メーカー・ディーラー", "学校関係者", "組合・団体関係者", "求人掲載希望"];
const interests = ["経営", "集客", "AI", "技術", "道具", "Q&A", "講習会", "求人", "Back Room"];

export default function SignupPage() {
  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-white pb-12 shadow-[0_0_80px_rgba(17,17,17,0.08)]">
      <section className="px-4 pt-6">
        <BrandLogo />
        <div className="mt-8">
          <p className="text-[0.74rem] font-black uppercase tracking-[0.14em] text-blush">成功を共有しよう。</p>
          <h1 className="mt-2 text-[2rem] font-black leading-tight text-ink">BARBER HUBに参加する</h1>
          <p className="mt-2 text-sm font-bold uppercase tracking-[0.12em] text-ink">One Success. Shared Success.</p>
          <p className="mt-4 text-[0.95rem] font-medium leading-relaxed text-mute">
            経験を共有し、THANKSと信頼を積み上げよう。読むだけなら無料。参加すると、もっと広がる。
          </p>
          <div className="mt-5 grid gap-2">
            <a href="#signup-form" className="inline-flex h-12 items-center justify-center rounded-[8px] bg-blush text-sm font-black text-white">
              無料で会員登録する
            </a>
            <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-[8px] border border-line text-sm font-black text-ink">
              すでに会員の方はログイン
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pt-7">
        <div className="grid gap-2">
          {signupBenefits.map((benefit) => (
            <div key={benefit} className="flex items-center gap-2 rounded-[8px] border border-line bg-white p-3 shadow-sm">
              <CheckCircle2 aria-hidden="true" size={18} className="shrink-0 text-blush" />
              <p className="text-sm font-black text-ink">{benefit}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pt-7">
        <div className="rounded-[8px] border border-blush/20 bg-blushSoft p-4">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <LockKeyhole aria-hidden="true" size={18} className="text-blush" />
            Back Roomは理容師だけの仕事終わりコミュニティです。
          </div>
          <p className="mt-2 text-[0.78rem] font-medium leading-relaxed text-mute">
            Back Roomは原則として理容師・理容学生のみ利用できます。安心してスレッドで話せる場所にするため、会員タイプを確認します。
          </p>
        </div>
      </section>

      <section id="signup-form" className="px-4 pt-7">
        <h2 className="text-lg font-black text-ink">会員タイプを選ぶ</h2>
        <div className="mt-3 no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {memberTypes.map((type, index) => (
            <button
              key={type}
              className={
                "shrink-0 rounded-full px-3 py-2 text-xs font-black " +
                (index === 0 ? "bg-blush text-white" : "border border-line bg-white text-ink")
              }
            >
              {type}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 px-4 pt-5">
        <div className="flex items-center gap-4 rounded-[8px] border border-line bg-white p-4 shadow-sm">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-neutral-100 text-mute">
            <ImagePlus aria-hidden="true" size={24} />
          </div>
          <div className="min-w-0">
            <button className="inline-flex h-10 items-center justify-center rounded-[8px] bg-ink px-4 text-sm font-black text-white">
              写真を追加
            </button>
            <Link href="#signup-form" className="mt-2 block text-xs font-black text-blush">
              あとで設定
            </Link>
          </div>
        </div>

        {[
          ["名前または表示名", "例：TAKA"],
          ["メールアドレス", "example@barberhub.jp"],
          ["パスワード", "8文字以上"],
          ["地域", "例：東京・渋谷"],
          ["店舗名または所属", "例：BARBER HUB SALON"],
          ["得意分野", "例：フェード / 白髪ぼかし / 経営"],
        ].map(([label, placeholder]) => (
          <label key={label} className="grid gap-2">
            <span className="text-sm font-black text-ink">{label}</span>
            <input
              type={label === "パスワード" ? "password" : label === "メールアドレス" ? "email" : "text"}
              className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-bold text-ink outline-none focus:border-blush"
              placeholder={placeholder}
            />
          </label>
        ))}

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">会員タイプ</span>
          <select className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush">
            {memberTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-black text-ink">興味カテゴリ</legend>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <label key={interest} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-xs font-black text-ink">
                <input type="checkbox" className="h-3.5 w-3.5 accent-blush" />
                {interest}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-start gap-2 rounded-[8px] bg-neutral-50 p-3 text-sm font-bold leading-relaxed text-ink">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-blush" />
          利用規約に同意します
        </label>

        <button className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-blush text-sm font-black text-white">
          <Sparkles aria-hidden="true" size={17} />
          無料で会員登録する
        </button>
        <p className="text-center text-xs font-bold text-mute">
          あなたに合った記事・投稿・求人・講習会を届けます。BARBER HUBは、理容師の毎朝の入口です。
        </p>
      </section>
    </main>
  );
}
