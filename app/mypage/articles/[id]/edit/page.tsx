import Link from "next/link";
import { redirect } from "next/navigation";
import { PageChrome } from "@/components/PageChrome";
import { ARTICLE_CATEGORIES, isPaidEligibleArticleCategory } from "@/lib/articleCategories";
import { pathWithParams } from "@/lib/auth/redirects";
import { PAID_ARTICLE_PRICES, isMonetizationEnabled } from "@/lib/monetization";
import { PAID_ARTICLE_PURCHASE_HISTORY_STATUSES } from "@/lib/paidArticleIntegrity";
import { createClient } from "@/lib/supabase/server";
import { updateMyArticleAction } from "./actions";

export default async function EditMyArticlePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ error?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(pathWithParams("/login", { next: `/mypage/articles/${id}/edit`, message: "記事を編集するにはログインしてください。" }));

  const { data: article } = await supabase
    .from("articles")
    .select("id, title, category, body, access_type, price_amount")
    .eq("id", id)
    .eq("author_id", user.id)
    .eq("is_deleted", false)
    .maybeSingle<{ id: string; title: string; category: string | null; body: string; access_type: string | null; price_amount: number | null }>();
  if (!article) redirect("/mypage");

  const [{ data: paidSection }, { data: categoryRows }, { count: purchaseHistoryCount, error: purchaseHistoryError }] = await Promise.all([
    supabase.from("article_paid_sections").select("body").eq("article_id", id).maybeSingle<{ body: string }>(),
    supabase.from("article_category_assignments").select("category").eq("article_id", id).returns<Array<{ category: string }>>(),
    supabase.from("paid_article_purchases").select("id", { count: "exact", head: true }).eq("article_id", id).in("status", PAID_ARTICLE_PURCHASE_HISTORY_STATUSES),
  ]);
  if (purchaseHistoryError) redirect(pathWithParams(`/mypage/articles/${id}/edit`, { error: "購入実績を確認できませんでした。もう一度お試しください。" }));
  const selectedCategories = new Set((categoryRows ?? []).map((row) => row.category));
  const hasPurchaseHistory = (purchaseHistoryCount ?? 0) > 0;
  const paidAllowed = isMonetizationEnabled() && isPaidEligibleArticleCategory(article.category);

  return (
    <PageChrome>
      <section className="px-4 pt-5">
        <Link href="/mypage" className="text-sm font-black text-ink">マイページへ戻る</Link>
        <h1 className="mt-4 text-2xl font-black text-ink">記事を編集</h1>
        {query?.error ? <p className="mt-3 rounded-[8px] bg-red-50 p-3 text-sm font-bold text-red-700">{query.error}</p> : null}

        <form action={updateMyArticleAction} className="mt-5 grid gap-4">
          <input type="hidden" name="articleId" value={article.id} />
          <label className="grid gap-1 text-sm font-black text-ink">
            タイトル
            <input name="title" defaultValue={article.title} maxLength={120} required className="h-11 rounded-[8px] border border-line px-3" />
          </label>
          <label className="grid gap-1 text-sm font-black text-ink">
            カテゴリー
            <select name="category" defaultValue={article.category ?? "経験記事"} className="h-11 rounded-[8px] border border-line px-3">
              {ARTICLE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>

          {article.category === "経験記事" ? (
            <fieldset className="grid gap-2 rounded-[8px] bg-neutral-50 p-3">
              <legend className="text-sm font-black">関連カテゴリ（複数可）</legend>
              <div className="flex flex-wrap gap-2">
                {ARTICLE_CATEGORIES.filter((category) => category !== "経験記事").map((category) => (
                  <label key={category} className="text-xs font-bold">
                    <input type="checkbox" name="experienceCategory" value={category} defaultChecked={selectedCategories.has(category)} className="mr-1" />
                    {category}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {paidAllowed ? (
            <fieldset className="grid gap-2 rounded-[8px] border border-amber-200 bg-amber-50/50 p-3">
              <legend className="text-sm font-black">有料公開</legend>
              {hasPurchaseHistory ? (
                <>
                  <input type="hidden" name="accessType" value="paid" />
                  <p className="text-xs font-bold text-ink">購入実績があるため、無料公開への変更と有料本文の編集・削除はできません。</p>
                </>
              ) : (
                <>
                  <label className="text-sm font-bold"><input type="radio" name="accessType" value="free" defaultChecked={article.access_type !== "paid"} className="mr-1" />無料公開</label>
                  <label className="text-sm font-bold"><input type="radio" name="accessType" value="paid" defaultChecked={article.access_type === "paid"} className="mr-1" />有料公開</label>
                </>
              )}
              <p className="text-[0.68rem] font-medium leading-relaxed text-mute">無料で多くの人に読んでもらうことで、Treatにつながりやすい場合もあります。</p>
              <select name="priceAmount" defaultValue={article.price_amount ?? 300} className="h-10 rounded-[8px] border border-line px-3">
                {PAID_ARTICLE_PRICES.map((price) => <option key={price} value={price}>{price}円</option>)}
              </select>
              <label className="text-xs font-medium text-mute"><input type="checkbox" name="confirmPriceChange" value="1" className="mr-1" />購入実績がある場合、価格変更の影響を確認しました。</label>
            </fieldset>
          ) : (
            <input type="hidden" name="accessType" value={article.access_type === "paid" ? "paid" : "free"} />
          )}

          <label className="grid gap-1 text-sm font-black text-ink">
            無料公開部分
            <textarea name="body" defaultValue={article.body} rows={8} required className="rounded-[8px] border border-line px-3 py-2" />
          </label>
          {paidAllowed ? (
            <label className="grid gap-1 text-sm font-black text-ink">
              ここから有料
              <textarea name="paidBody" defaultValue={paidSection?.body ?? ""} rows={8} readOnly={hasPurchaseHistory} className="rounded-[8px] border border-amber-200 px-3 py-2 read-only:bg-amber-50" />
            </label>
          ) : null}
          <button type="submit" className="h-11 rounded-[8px] bg-ink text-sm font-black text-white">保存する</button>
        </form>
      </section>
    </PageChrome>
  );
}
