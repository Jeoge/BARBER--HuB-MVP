import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SignupRequiredCard } from "@/components/AuthGate";
import { BackRoomSetupSheet } from "@/components/BackRoomSetupSheet";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { createClient } from "@/lib/supabase/server";

export default async function BackyardSetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
    return (
      <PageChrome>
        <section className="px-4 pt-4">
          <Link href="/backyard" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
            <ArrowLeft aria-hidden="true" size={17} />
            戻る
          </Link>
        </section>
        <PageHeaderBlock
          eyebrow="BACK ROOM SETUP"
          title="Back Room設定"
          body="Back Roomに入る前に、会員登録またはログインが必要です。"
        />
        <SignupRequiredCard kind="backyard" />
      </PageChrome>
    );
  }

  return (
    <PageChrome>
      <section className="px-4 pt-4">
        <Link href="/backyard" className="inline-flex items-center gap-1.5 text-sm font-black text-ink">
          <ArrowLeft aria-hidden="true" size={17} />
          戻る
        </Link>
      </section>

      <PageHeaderBlock
        eyebrow="BACK ROOM SETUP"
        title="Back Room設定"
        body="Back Roomに入る前に、ニックネーム・職種・地域・ルール同意を確認します。"
      />

      <BackRoomSetupSheet />
    </PageChrome>
  );
}
