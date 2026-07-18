import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoadingSubmitButton } from "@/components/LoadingButton";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { pathWithParams } from "@/lib/auth/redirects";
import { PREFECTURES } from "@/lib/japanAreas";
import { getOwnedVerifiedBarberShop } from "@/lib/supabase/barber-shops";
import { createClient } from "@/lib/supabase/server";
import { updateVerifiedBarberShopAction } from "@/app/stores/actions";

type StoreEditPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
};

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-ink">{label}</span>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush"
        placeholder={placeholder}
      />
    </label>
  );
}

export default async function StoreEditPage({ params, searchParams }: StoreEditPageProps) {
  const { id } = await params;
  const pageParams = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
    redirect(pathWithParams("/login", { next: `/mypage/stores/${id}/edit`, message: "店舗情報を編集するにはログインしてください。" }));
  }

  const { shop, error } = await getOwnedVerifiedBarberShop(supabase, user.id, id);

  if (error) {
    console.error("Owned verified barber shop lookup failed", {
      shopId: id,
      userId: user.id,
      message: error.message,
    });
  }

  if (shop == null) {
    redirect(pathWithParams("/mypage", { storeError: "編集できる認証済み店舗が見つかりませんでした。" }));
  }

  return (
    <PageChrome>
      <section className="px-4 pt-5">
        <Link href="/mypage" className="inline-flex items-center gap-1 text-sm font-black text-ink">
          <ArrowLeft aria-hidden="true" size={17} />
          マイページへ戻る
        </Link>
      </section>

      <PageHeaderBlock
        eyebrow="STORE ADMIN"
        title="店舗情報を編集"
        body="オーナー認証済み店舗のディレクトリ基本情報を編集します。口コミ、評価、ランキングは扱いません。"
      />

      <form action={updateVerifiedBarberShopAction} className="grid gap-5 px-4 pt-5">
        <input type="hidden" name="shopId" value={shop.id} />
        {pageParams?.error ? (
          <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
            {pageParams.error}
          </div>
        ) : null}

        <section className="grid gap-4 rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
          <Field name="name" label="店舗名" defaultValue={shop.name} required />
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2">
              <span className="text-sm font-black text-ink">都道府県</span>
              <select
                name="prefecture"
                required
                className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush"
                defaultValue={shop.prefecture}
              >
                {PREFECTURES.map((prefecture) => (
                  <option key={prefecture} value={prefecture}>
                    {prefecture}
                  </option>
                ))}
              </select>
            </label>
            <Field name="municipality" label="市区町村" defaultValue={shop.municipality} required />
          </div>
          <Field name="address" label="住所" defaultValue={shop.address} required />
          <Field name="phone" label="電話番号（任意）" defaultValue={shop.phone} placeholder="092-000-0000" />
          <Field name="postal_code" label="郵便番号（任意）" defaultValue={shop.postal_code} placeholder="819-0000" />
        </section>

        <p className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-medium leading-relaxed text-mute">
          認証状態、オーナー紐づけ、公開状態はこの画面では変更できません。必要な場合は運営確認で対応します。
        </p>

        <LoadingSubmitButton pendingText="保存中..." className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-ink text-sm font-black text-white">
          <Save aria-hidden="true" size={17} />
          店舗情報を保存する
        </LoadingSubmitButton>
      </form>
    </PageChrome>
  );
}
