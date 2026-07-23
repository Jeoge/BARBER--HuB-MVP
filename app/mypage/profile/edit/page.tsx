import Link from "next/link";
import { ArrowLeft, ExternalLink, MapPin, Save } from "lucide-react";
import { LoadingSubmitButton } from "@/components/LoadingButton";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { ProfileImageField } from "@/components/ProfileImageField";
import { SafetyNotice } from "@/components/SafetyNotice";
import { ACCOUNT_TYPE_OPTIONS, isSelectableAccountType } from "@/lib/accountTypes";
import { pathWithParams } from "@/lib/auth/redirects";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { saveProfileAction } from "./actions";

function Field({
  label,
  name,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string | null;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-ink">{label}</span>
      <input
        name={name}
        type="text"
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush"
      />
    </label>
  );
}

type ProfileEditPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function ProfileEditPage({ searchParams }: ProfileEditPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
    redirect(
      pathWithParams("/login", {
        next: "/mypage/profile/edit",
        message: "プロフィールを編集するにはログインしてください。",
      })
    );
  }

  const { profile, error: profileError } = await getAccountProfile(supabase, user.id);
  const currentJobType = profile?.job_type?.trim() ?? "";
  const showCurrentJobType = currentJobType.length > 0 && !isSelectableAccountType(currentJobType);

  return (
    <PageChrome>
      <section className="px-4 pt-5">
        <Link href="/mypage" className="inline-flex items-center gap-1 text-sm font-black text-ink">
          <ArrowLeft aria-hidden="true" size={17} />
          戻る
        </Link>
        <p className="mt-6 text-[0.68rem] font-black uppercase tracking-[0.14em] text-blush">PROFILE EDIT</p>
        <h1 className="mt-1 text-[1.55rem] font-black leading-tight text-ink">プロフィールを編集</h1>
        <p className="mt-2 text-[0.86rem] font-medium leading-relaxed text-mute">
          ログイン中のアカウントに紐づくプロフィール情報を保存します。
        </p>
      </section>

      <PageHeaderBlock
        eyebrow="ACCOUNT"
        title="保存される項目"
        body="メールアドレスはSupabase Authのログイン情報として扱い、profilesテーブルには保存しません。"
      />

      <form action={saveProfileAction} className="grid gap-4 px-4 pt-5">
        {params?.error ? (
          <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
            {params.error}
          </div>
        ) : null}
        {profileError ? (
          <div className="rounded-[8px] border border-line bg-neutral-50 p-3 text-xs font-bold leading-relaxed text-mute">
            既存プロフィールを読み込めませんでした。保存すると、入力内容でプロフィールを作成または更新します。
          </div>
        ) : null}

        <SafetyNotice title="公開プロフィールの確認" href="/privacy" linkLabel="プライバシーポリシー">
          プロフィールに入力した店舗名、住所、SNS、外部リンクは公開プロフィールに表示される場合があります。公開したくない情報は入力しないでください。
        </SafetyNotice>

        <Field name="display_name" label="表示名" defaultValue={profile?.display_name} placeholder="例：福岡の理容師" />
        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">登録区分</span>
          <select
            name="job_type"
            className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush"
            defaultValue={profile?.job_type ?? ""}
          >
            <option value="">未設定</option>
            {showCurrentJobType ? <option value={currentJobType}>現在の登録値：{currentJobType}</option> : null}
            {ACCOUNT_TYPE_OPTIONS.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <span className="text-[0.72rem] font-medium leading-relaxed text-mute">
            登録区分はプロフィール表示用です。店舗管理や求人掲載には、別途店舗機能の追加が必要です。学校・メーカー・ディーラー・組合・企業などの告知は広告掲載・協賛の問い合わせから運営確認後に扱います。
          </span>
        </label>
        <Field name="salon_name" label="サロン名" defaultValue={profile?.salon_name} placeholder="例：BARBER HUB SALON" />
        <Field name="region" label="地域" defaultValue={profile?.region} placeholder="例：福岡県 福岡市" />
        <div className="grid gap-4 rounded-[8px] border border-line bg-neutral-50 p-3">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <MapPin aria-hidden="true" size={16} className="text-blush" />
            お店情報
          </div>
          <Field name="shop_address" label="お店の住所" defaultValue={profile?.shop_address} placeholder="例：福岡県福岡市..." />
          <Field name="shop_map_url" label="GoogleマップURL" defaultValue={profile?.shop_map_url} placeholder="https://maps.google.com/..." />
        </div>
        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">自己紹介</span>
          <textarea
            name="bio"
            rows={5}
            defaultValue={profile?.bio ?? ""}
            className="resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush"
            placeholder="得意技術、働き方、発信したいことなどを書いてください。"
          />
        </label>

        <div className="grid gap-4 rounded-[8px] border border-line bg-neutral-50 p-3">
          <ProfileImageField
            label="丸いアイコン写真"
            currentUrl={profile?.avatar_url}
            shape="circle"
            libraryInputName="avatar_image_library"
            cameraInputName="avatar_image_camera"
            removeInputName="remove_avatar_image"
            cameraCapture="user"
          />
          <ProfileImageField
            label="背景写真 / カバー写真"
            currentUrl={profile?.cover_url}
            shape="wide"
            libraryInputName="cover_image_library"
            cameraInputName="cover_image_camera"
            removeInputName="remove_cover_image"
            cameraCapture="environment"
          />
        </div>

        <div className="grid gap-4 rounded-[8px] border border-line bg-neutral-50 p-3">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <ExternalLink aria-hidden="true" size={16} className="text-blush" />
            公開リンク
          </div>
          <Field name="website_url" label="公式サイト" defaultValue={profile?.website_url} placeholder="https://example.com" />
          <Field name="instagram_url" label="Instagram" defaultValue={profile?.instagram_url} placeholder="https://www.instagram.com/..." />
          <Field name="youtube_url" label="YouTube" defaultValue={profile?.youtube_url} placeholder="https://www.youtube.com/..." />
          <Field name="tiktok_url" label="TikTok" defaultValue={profile?.tiktok_url} placeholder="https://www.tiktok.com/@..." />
          <Field name="x_url" label="X / Twitter" defaultValue={profile?.x_url} placeholder="https://x.com/..." />
          <Field name="line_url" label="LINE公式リンク" defaultValue={profile?.line_url} placeholder="https://lin.ee/..." />
          <Field name="hotpepper_url" label="Hot Pepper Beauty" defaultValue={profile?.hotpepper_url} placeholder="https://beauty.hotpepper.jp/..." />
          <Field name="rakuten_url" label="楽天ビューティ" defaultValue={profile?.rakuten_url} placeholder="https://beauty.rakuten.co.jp/..." />
          <Field name="booking_url" label="予約リンク" defaultValue={profile?.booking_url} placeholder="https://..." />
        </div>

        <LoadingSubmitButton pendingText="保存中..." className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-ink text-sm font-black text-white">
          <Save aria-hidden="true" size={17} />
          保存する
        </LoadingSubmitButton>
      </form>
    </PageChrome>
  );
}
