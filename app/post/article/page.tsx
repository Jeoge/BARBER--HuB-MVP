import { ArrowLeft, FilePenLine, Save, Send, Sparkles, UserRoundPen } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupRequiredCard } from "@/components/AuthGate";
import { PageChrome } from "@/components/PageChrome";
import { SafetyChecklistSubmit } from "@/components/SafetyChecklist";
import { pathWithParams } from "@/lib/auth/redirects";
import { getPostPermissionRedirect } from "@/lib/permissions";
import { getAccountProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";
import { createArticleAction } from "./actions";

const categories = ["経営", "技術", "集客", "AI活用", "独立", "道具", "求人", "講習会", "講習会レポート", "コンクールレポート", "経験記事"];
const articleSafetyItems = [
  {
    name: "articleExperienceConfirmed",
    label: "自分の経験・考えとして投稿します。",
  },
  {
    name: "articleNoHarmConfirmed",
    label: "他店・個人・お客様が不利益を受ける内容は含めていません。",
  },
  {
    name: "articlePrDisclosureChecked",
    label: "企業依頼・報酬・商品提供がある場合はPRとして申告します。",
  },
];

type ArticlePostPageProps = {
  searchParams?: Promise<{ error?: string; category?: string; type?: string }>;
};

function defaultArticleCategory(categoryParam: string | undefined, typeParam: string | undefined) {
  const value = categoryParam ?? typeParam;
  if (value === "seminar_report") return "講習会レポート";
  if (value === "competition_report") return "コンクールレポート";
  if (value && categories.includes(value)) return value;
  return "経営";
}

function ProfileRequiredCard() {
  return (
    <section className="px-4 pt-4">
      <div className="rounded-[10px] border border-blush/20 bg-white p-4 shadow-sm">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-blushSoft text-blush">
          <UserRoundPen aria-hidden="true" size={22} />
        </div>
        <h2 className="mt-4 text-lg font-black leading-tight text-ink">プロフィール設定後に記事投稿できます</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-mute">
          投稿者として表示するため、先に表示名や地域を設定してください。
        </p>
        <Link href="/mypage/profile/edit" className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink text-sm font-black text-white">
          プロフィールを設定する
        </Link>
      </div>
    </section>
  );
}

export default async function ArticlePostPage({ searchParams }: ArticlePostPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Article post page auth lookup failed", {
        message: userError.message,
      });
    }

    return (
      <PageChrome>
        <section className="px-4 pt-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
            <ArrowLeft aria-hidden="true" size={17} />
            戻る
          </Link>
        </section>
        <SignupRequiredCard />
      </PageChrome>
    );
  }

  const { profile, error: profileError } = await getAccountProfile(supabase, user.id);

  if (profileError) {
    console.error("Article post page profile lookup failed", {
      userId: user.id,
      message: profileError.message,
    });
  }

  if (profileError == null && profile == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
            <ArrowLeft aria-hidden="true" size={17} />
            戻る
          </Link>
        </section>
        <ProfileRequiredCard />
      </PageChrome>
    );
  }

  if (profileError) {
    redirect(pathWithParams("/mypage/profile/edit", { error: "プロフィール情報を確認できませんでした。保存後に記事投稿をお試しください。" }));
  }

  const defaultCategory = defaultArticleCategory(params?.category, params?.type);
  const capability = defaultCategory === "講習会レポート" || defaultCategory === "コンクールレポート" ? "report" : "article";
  const permissionRedirect = getPostPermissionRedirect(profile, capability, "/post/article");
  if (permissionRedirect) {
    redirect(permissionRedirect);
  }

  return (
    <PageChrome>
      <section className="px-4 pt-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
          <ArrowLeft aria-hidden="true" size={17} />
          戻る
        </Link>
        <div className="mt-4 rounded-[8px] border border-blush/20 bg-white p-4 shadow-sm">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-blushSoft text-blush">
            <FilePenLine aria-hidden="true" size={22} />
          </div>
          <p className="mt-3 text-[0.68rem] font-black uppercase tracking-[0.14em] text-blush">ARTICLE POST</p>
          <h1 className="mt-1 text-[1.5rem] font-black leading-tight text-ink">経験記事を書く</h1>
          <p className="mt-2 text-[0.86rem] font-medium leading-relaxed text-mute">
            あなたの実体験を、経営・技術・集客のヒントとして投稿できます。
          </p>
          <div className="mt-3 flex items-start gap-2 rounded-[8px] bg-blushSoft p-3">
            <Sparkles aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-blush" />
            <p className="text-[0.78rem] font-black leading-relaxed text-ink">
              うまくいった話も、途中の試行錯誤も価値になります。
            </p>
          </div>
        </div>
      </section>

      <form action={createArticleAction} className="grid gap-4 px-4 pt-4">
        {params?.error ? (
          <div className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-black leading-relaxed text-red-700">
            {params.error}
          </div>
        ) : null}

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">タイトル</span>
          <input
            name="title"
            maxLength={120}
            required
            className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-bold text-ink outline-none focus:border-blush"
            placeholder="例：Google口コミ返信を変えたら新規予約が増えた話"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">カテゴリー</span>
          <select name="category" defaultValue={defaultCategory} className="h-12 rounded-[8px] border border-line bg-white px-3 text-sm font-black text-ink outline-none focus:border-blush">
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">本文</span>
          <textarea
            name="body"
            rows={9}
            required
            className="resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush"
            placeholder="背景、試したこと、結果、学びを書いてください。"
          />
        </label>

        <div className="rounded-[8px] border border-line/80 bg-neutral-50 px-3 py-2.5 text-[0.72rem] font-medium leading-relaxed text-mute">
          <p className="font-black text-ink/70">投稿ルール</p>
          <p className="mt-1">
            企業・団体から依頼された投稿、報酬や商品提供を受けた投稿、告知・販売を主目的とする投稿は、PR・協賛掲載として扱う場合があります。
          </p>
          <p className="mt-1">
            講習会・コンクールのレポートは、参加して感じたこと、学んだこと、次に活かしたいことを自由に残してください。
          </p>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-black text-ink">この記事で伝えたいこと</span>
          <textarea
            name="takeaway"
            rows={3}
            className="resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-sm font-medium leading-relaxed text-ink outline-none focus:border-blush"
            placeholder="読んだ人に一番持ち帰ってほしいこと。"
          />
        </label>

        <SafetyChecklistSubmit
          title="記事投稿前の確認"
          body="経験記事は、あなたの実体験・工夫・学びを共有する場所です。断定的な効果保証、他店批判、無断転載、PR表記のない広告投稿は避けてください。講習会・コンクールのレポートは、参加して感じたことや次に活かしたいことを中心に残してください。"
          items={articleSafetyItems}
          pendingText="投稿中..."
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-blush text-sm font-black text-white"
        >
          <Send aria-hidden="true" size={17} />
          投稿する
        </SafetyChecklistSubmit>

        <button type="button" disabled className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] border border-line bg-neutral-50 text-sm font-black text-mute">
          <Save aria-hidden="true" size={17} />
          下書き
        </button>
      </form>
    </PageChrome>
  );
}
