import { BadgeCheck, Building2, CheckCircle2, MapPin, Pencil, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageChrome } from "@/components/PageChrome";
import { pathWithParams } from "@/lib/auth/redirects";
import {
  getMyBarberShopClaim,
  getPublicBarberShop,
  shopAddressLabel,
  shopAreaLabel,
  shopPhoneLabel,
  shopVerificationLabel,
} from "@/lib/supabase/barber-shops";
import { createClient } from "@/lib/supabase/server";
import { requestBarberShopClaimAction } from "../actions";

type StoreDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ claim?: string; error?: string; registered?: string }>;
};

export async function generateMetadata({ params }: StoreDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { shop } = await getPublicBarberShop(supabase, id);

  if (shop == null) {
    return {
      title: "店舗が見つかりません | BARBER HUB",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${shop.name} | BARBER HUB 店舗ディレクトリ`,
    description: `${shopAreaLabel(shop)}の理容店舗情報。BARBER HUBの店舗ディレクトリで基本情報と認証状態を確認できます。`,
    alternates: {
      canonical: `/stores/${shop.id}`,
    },
  };
}

function StatusBadge({ status }: { status: string }) {
  const verified = status === "verified";

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-[0.66rem] font-semibold text-ink/78">
      {verified ? <BadgeCheck aria-hidden="true" size={13} className="text-blush" /> : <ShieldCheck aria-hidden="true" size={13} className="text-mute" />}
      {shopVerificationLabel(status)}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-[5rem_1fr] gap-3 px-3 py-3 text-sm">
      <span className="font-bold text-mute">{label}</span>
      <span className="break-words font-semibold text-ink">{value?.trim() || "未設定"}</span>
    </div>
  );
}

export default async function StoreDetailPage({ params, searchParams }: StoreDetailPageProps) {
  const { id } = await params;
  const pageParams = await searchParams;
  const supabase = await createClient();
  const { shop, error } = await getPublicBarberShop(supabase, id);

  if (error) {
    console.error("Barber shop detail lookup failed", {
      shopId: id,
      message: error.message,
    });
  }

  if (shop == null) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isVerifiedOwner = user?.id === shop.owner_user_id && shop.verification_status === "verified";
  const { claim } = user ? await getMyBarberShopClaim(supabase, user.id, shop.id) : { claim: null };
  const hasPendingClaim = claim?.status === "pending";
  const canClaim = shop.verification_status !== "verified" && shop.verification_status !== "suspended";

  return (
    <PageChrome>
      <section className="px-4 pt-5">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-black text-ink">
          BARBER HUBへ戻る
        </Link>
      </section>

      <section className="px-4 pt-5">
        <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.04)]">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-blush">BARBER DIRECTORY</p>
          <div className="mt-3 flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-neutral-50 text-ink">
              <Building2 aria-hidden="true" size={20} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={shop.verification_status} />
                {shop.source_type === "owner_created" ? (
                  <span className="rounded-full border border-line bg-neutral-50 px-2.5 py-1 text-[0.66rem] font-semibold text-mute">登録申請</span>
                ) : null}
              </div>
              <h1 className="mt-3 text-[1.55rem] font-black leading-tight text-ink">{shop.name}</h1>
              <p className="mt-2 flex items-center gap-1 text-xs font-bold text-mute">
                <MapPin aria-hidden="true" size={14} />
                {shopAreaLabel(shop)}
              </p>
            </div>
          </div>
          {pageParams?.registered === "1" ? (
            <p className="mt-4 rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-xs font-black leading-relaxed text-ink">
              店舗登録を受け付けました。認証状態は申請中として保存されています。
            </p>
          ) : null}
          {pageParams?.claim === "pending" ? (
            <p className="mt-4 rounded-[8px] border border-blush/20 bg-blushSoft p-3 text-xs font-black leading-relaxed text-ink">
              オーナー認証申請を受け付けました。確認が完了するまでお待ちください。
            </p>
          ) : null}
          {pageParams?.error ? (
            <p className="mt-4 rounded-[8px] border border-red-200 bg-red-50 p-3 text-xs font-black leading-relaxed text-red-700">
              {pageParams.error}
            </p>
          ) : null}
        </div>
      </section>

      <section className="px-4 pt-6">
        <h2 className="text-sm font-black text-ink">基本情報</h2>
        <div className="mt-3 divide-y divide-line rounded-[8px] border border-line bg-white">
          <DetailRow label="店舗名" value={shop.name} />
          <DetailRow label="地域" value={shopAreaLabel(shop)} />
          <DetailRow label="住所" value={shopAddressLabel(shop)} />
          <DetailRow label="電話番号" value={shopPhoneLabel(shop.phone)} />
          <DetailRow label="認証状態" value={shopVerificationLabel(shop.verification_status)} />
          <DetailRow label="掲載元" value={shop.source} />
        </div>
        <p className="mt-3 rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-medium leading-relaxed text-mute">
          BARBER HUBの店舗ディレクトリは、口コミ・評価・ランキングを扱いません。掲載情報は店舗基本情報と認証状態を中心に整理します。
        </p>
      </section>

      {isVerifiedOwner ? (
        <section className="px-4 pt-6">
          <div className="rounded-[10px] border border-blush/20 bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
            <div className="flex items-center gap-2 text-sm font-black text-ink">
              <CheckCircle2 aria-hidden="true" size={17} className="text-blush" />
              認証済み店舗の管理
            </div>
            <p className="mt-2 text-xs font-medium leading-relaxed text-mute">
              この店舗はログイン中のアカウントに紐づいています。ディレクトリ上の基本情報を編集できます。
            </p>
            <Link href={`/mypage/stores/${shop.id}/edit`} className="mt-3 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[8px] bg-ink px-3 text-sm font-black text-white">
              <Pencil aria-hidden="true" size={16} />
              店舗情報を編集する
            </Link>
          </div>
        </section>
      ) : null}

      {canClaim && !isVerifiedOwner ? (
        <section className="px-4 pt-6">
          <div className="rounded-[10px] border border-line bg-white p-4 shadow-[0_10px_28px_rgba(17,17,17,0.035)]">
            <div className="flex items-center gap-2 text-sm font-black text-ink">
              <ShieldCheck aria-hidden="true" size={17} className="text-blush" />
              このお店を管理する
            </div>
            {hasPendingClaim ? (
              <p className="mt-3 rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
                この店舗への認証申請はすでに受付済みです。申請しただけでは認証済みにはなりません。
              </p>
            ) : user == null ? (
              <div className="mt-3 grid gap-2">
                <p className="text-xs font-medium leading-relaxed text-mute">
                  オーナー認証申請にはログインが必要です。戻り先を保持してログインできます。
                </p>
                <Link href={pathWithParams("/login", { next: `/stores/${shop.id}?claim=1`, message: "店舗のオーナー認証申請にはログインしてください。" })} className="inline-flex h-11 items-center justify-center rounded-[8px] bg-ink px-3 text-sm font-black text-white">
                  ログインして管理申請
                </Link>
                <Link href={pathWithParams("/signup", { next: `/stores/${shop.id}?claim=1` })} className="inline-flex h-10 items-center justify-center rounded-[8px] border border-line bg-white px-3 text-xs font-black text-ink">
                  会員登録へ
                </Link>
              </div>
            ) : (
              <form action={requestBarberShopClaimAction} className="mt-3 grid gap-3">
                <input type="hidden" name="shopId" value={shop.id} />
                <label className="grid gap-2">
                  <span className="text-xs font-black text-ink">店舗との関係</span>
                  <select
                    name="relation"
                    required
                    className="h-11 rounded-[8px] border border-line bg-white px-3 text-xs font-semibold text-ink outline-none focus:border-blush"
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
                  <span className="text-xs font-black text-ink">補足（任意）</span>
                  <textarea
                    name="message"
                    rows={3}
                    className="resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-xs font-medium leading-relaxed text-ink outline-none focus:border-blush"
                    placeholder="確認に必要な補足があれば記入してください。"
                  />
                </label>
                <button type="submit" className="inline-flex h-11 items-center justify-center rounded-[8px] bg-ink px-3 text-sm font-black text-white">
                  このお店を管理する
                </button>
              </form>
            )}
          </div>
        </section>
      ) : null}
    </PageChrome>
  );
}
