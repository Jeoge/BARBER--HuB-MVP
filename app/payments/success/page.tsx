import Link from "next/link";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { safeNextPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

export default async function PaymentSuccessPage({ searchParams }: { searchParams?: Promise<{ session_id?: string; return_to?: string }> }) {
  const params = await searchParams;
  const returnTo = safeNextPath(params?.return_to, "/mypage");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let completed = false;
  if (user && params?.session_id) {
    const [treat, purchase] = await Promise.all([
      supabase.from("content_treats").select("id, status").eq("stripe_checkout_session_id", params.session_id).eq("sender_id", user.id).maybeSingle<{ id: string; status: string }>(),
      supabase.from("paid_article_purchases").select("id, status").eq("stripe_checkout_session_id", params.session_id).eq("buyer_id", user.id).maybeSingle<{ id: string; status: string }>(),
    ]);
    completed = treat.data?.status === "completed" || purchase.data?.status === "completed";
  }
  return (
    <PageChrome>
      <PageHeaderBlock eyebrow="PAYMENT" title={completed ? "決済が完了しました" : "決済を確認しています"} body={completed ? "処理が完了しました。" : "Stripeからの決済確認を反映しています。数秒後にもう一度ご確認ください。"} />
      <section className="px-4 pt-5">
        <Link href={returnTo} className="inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-ink text-sm font-black text-white">投稿へ戻る</Link>
      </section>
    </PageChrome>
  );
}
