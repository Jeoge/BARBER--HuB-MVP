import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { SignupRequiredCard } from "@/components/AuthGate";
import { PageChrome } from "@/components/PageChrome";
import { currentUser } from "@/lib/userDashboard";
import { findPublicProfile } from "@/lib/publicProfiles";
import { createClient } from "@/lib/supabase/server";

const profileTypes = ["理容師", "美容師", "理容学生", "美容学生", "理美容アシスタント", "サロン", "理容学校", "美容学校", "メーカー", "ディーラー", "組合"];

function Field({ label, placeholder, defaultValue }: { label: string; placeholder?: string; defaultValue?: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-ink">{label}</span>
      <input
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-blush"
      />
    </label>
  );
}

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-5">
          <Link href="/mypage" className="inline-flex items-center gap-1 text-sm font-black text-ink">
            <ArrowLeft aria-hidden="true" size={17} />
            戻る
          </Link>
        </section>
        <SignupRequiredCard />
      </PageChrome>
    );
  }

  const profile = findPublicProfile(currentUser.profileId);

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
          公開プロフィールに表示する情報を整えます。MVPでは保存処理はまだ仮です。
        </p>
      </section>

      <section className="grid gap-4 px-4 pt-5">
        <Field label="表示名" defaultValue={profile?.displayName} placeholder="例：福岡の理容師" />
        <Field label="プロフィール画像URL" defaultValue={profile?.avatarUrl} placeholder="/images/fade-cut.jpg" />
        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">自己紹介</span>
          <textarea
            rows={5}
            defaultValue={profile?.bio}
            className="resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush"
          />
        </label>
        <Field label="活動エリア" defaultValue={profile?.area} placeholder="例：福岡県 福岡市" />
        <Field label="Instagram URL" defaultValue={profile?.links?.instagram} placeholder="https://instagram.com/..." />
        <Field label="公式サイトURL" defaultValue={profile?.links?.website} placeholder="https://..." />
        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">種別</span>
          <select className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush" defaultValue={profile?.badges[0] ?? "サロン"}>
            {profileTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="flex items-start gap-2 rounded-[8px] bg-neutral-50 p-3 text-sm font-bold leading-relaxed text-ink">
          <input type="checkbox" defaultChecked={profile?.isHiring} className="mt-1 h-4 w-4 accent-blush" />
          求人中として表示する
        </label>
        <button type="button" className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-ink text-sm font-black text-white">
          <Save aria-hidden="true" size={17} />
          仮保存する
        </button>
      </section>
    </PageChrome>
  );
}
