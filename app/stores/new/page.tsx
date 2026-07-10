import { ArrowLeft, CheckCircle2, Store } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoadingSubmitButton } from "@/components/LoadingButton";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { SafetyNotice } from "@/components/SafetyNotice";
import { pathWithParams } from "@/lib/auth/redirects";
import { PREFECTURES } from "@/lib/japanAreas";
import { createClient } from "@/lib/supabase/server";
import { createBarberShopAction } from "../actions";

type StoreNewPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

function Field({
  label,
  name,
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-ink">{label}</span>
      <input
        name={name}
        required={required}
        className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush"
        placeholder={placeholder}
      />
    </label>
  );
}

export default async function StoreNewPage({ searchParams }: StoreNewPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
    redirect(pathWithParams("/login", { next: "/stores/new", message: "店舗登録にはログインしてください。" }));
  }

  return (
    <PageChrome>
      <section className="px-4 pt-5">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-black text-ink">
          <ArrowLeft aria-hidden="true" size={17} />
          ホームへ戻る
        </Link>
      </section>

      <PageHeaderBlock
        eyebrow="BARBER DIRECTORY"
        title="店舗登録申請"
        body="店舗ディレクトリに見つからない理容店舗を登録申請できます。登録後すぐに認証済みにはならず、確認待ちとして保存されます。"
      />

      <form action={createBarberShopAction} className="grid gap-5 px-4 pt-5">
        {params?.error ? (
          <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
            {params.error}
          </div>
        ) : null}

        <SafetyNotice title="登録できる情報" href="/guidelines" linkLabel="投稿ガイドライン">
          口コミ、評価、ランキング、他社サイトからコピーした紹介文や写真は登録しません。店舗名、地域、住所など事実確認できる基本情報だけを保存します。
        </SafetyNotice>

        <section className="grid gap-4 rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <Store aria-hidden="true" size={17} className="text-blush" />
            店舗情報
          </div>
          <Field name="name" label="店舗名" placeholder="例：BARBER HUB 福岡西" required />
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2">
              <span className="text-sm font-black text-ink">都道府県</span>
              <select
                name="prefecture"
                required
                className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush"
                defaultValue=""
              >
                <option value="" disabled>選択</option>
                {PREFECTURES.map((prefecture) => (
                  <option key={prefecture} value={prefecture}>
                    {prefecture}
                  </option>
                ))}
              </select>
            </label>
            <Field name="municipality" label="市区町村" placeholder="福岡市西区" required />
          </div>
          <Field name="address" label="住所" placeholder="福岡県福岡市西区..." required />
          <Field name="postal_code" label="郵便番号（任意）" placeholder="819-0000" />
        </section>

        <section className="grid gap-4 rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <CheckCircle2 aria-hidden="true" size={17} className="text-blush" />
            申請者情報
          </div>
          <label className="grid gap-2">
            <span className="text-sm font-black text-ink">登録者との関係</span>
            <select
              name="relation"
              required
              className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush"
              defaultValue=""
            >
              <option value="" disabled>選択してください</option>
              <option value="owner">オーナー</option>
              <option value="representative">代表者</option>
              <option value="manager">店長・管理者</option>
              <option value="staff">スタッフ</option>
              <option value="related">その他関係者</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-black text-ink">補足（任意）</span>
            <textarea
              name="message"
              rows={4}
              className="resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush"
              placeholder="確認に必要な補足があれば記入してください。"
            />
          </label>
          <label className="flex items-start gap-2 rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-ink">
            <input name="confirmed" type="checkbox" value="yes" required className="mt-0.5 h-4 w-4 shrink-0 accent-blush" />
            入力内容は事実に基づく店舗基本情報です。口コミ、評価、ランキング、他社サイトからコピーした文章・写真は含めていません。
          </label>
        </section>

        <LoadingSubmitButton pendingText="申請中..." className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-ink text-sm font-black text-white">
          <CheckCircle2 aria-hidden="true" size={17} />
          店舗登録を申請する
        </LoadingSubmitButton>
      </form>
    </PageChrome>
  );
}
