import Link from "next/link";
import { ArrowLeft, ImagePlus, Save } from "lucide-react";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { pathWithParams } from "@/lib/auth/redirects";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { saveProfileAction } from "./actions";

const profileTypes = ["理容師", "美容師", "理容学生", "美容学生", "理美容アシスタント", "サロン", "理容学校", "美容学校", "メーカー", "ディーラー", "組合"];

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

function ImageField({
  label,
  name,
  currentUrl,
  shape = "square",
}: {
  label: string;
  name: string;
  currentUrl?: string | null;
  shape?: "circle" | "wide" | "square";
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-ink">{label}</span>
      {currentUrl ? (
        <span className="block overflow-hidden rounded-[8px] border border-line bg-neutral-50 p-2">
          <img
            src={currentUrl}
            alt=""
            className={
              shape === "circle"
                ? "h-20 w-20 rounded-full object-cover"
                : shape === "wide"
                  ? "aspect-[16/7] w-full rounded-[7px] object-cover"
                  : "aspect-square w-24 rounded-[7px] object-cover"
            }
          />
        </span>
      ) : null}
      <span className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink">
        <ImagePlus aria-hidden="true" size={16} className="text-blush" />
        画像を選択
      </span>
      <input name={name} type="file" accept="image/*" className="sr-only" />
      <span className="text-[0.68rem] font-semibold leading-relaxed text-mute">未選択なら現在の画像をそのまま使います。5MB以下。</span>
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

        <Field name="display_name" label="表示名" defaultValue={profile?.display_name} placeholder="例：福岡の理容師" />
        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">職種</span>
          <select
            name="job_type"
            className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush"
            defaultValue={profile?.job_type ?? ""}
          >
            <option value="">未設定</option>
            {profileTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <Field name="salon_name" label="サロン名" defaultValue={profile?.salon_name} placeholder="例：BARBER HUB SALON" />
        <Field name="region" label="地域" defaultValue={profile?.region} placeholder="例：福岡県 福岡市" />
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
          <ImageField label="丸いアイコン写真" name="avatar_image" currentUrl={profile?.avatar_url} shape="circle" />
          <ImageField label="背景写真 / カバー写真" name="cover_image" currentUrl={profile?.cover_url} shape="wide" />
        </div>

        <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-ink text-sm font-black text-white">
          <Save aria-hidden="true" size={17} />
          保存する
        </button>
      </form>
    </PageChrome>
  );
}
