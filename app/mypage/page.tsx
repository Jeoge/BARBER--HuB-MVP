import { SignupRequiredCard } from "@/components/AuthGate";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";

export default function MyPage() {
  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="MY PAGE"
        title="マイページ"
        body="THANKS、保存記事、投稿履歴、得意技術に合わせたおすすめを確認できます。"
      />
      <SignupRequiredCard />
    </PageChrome>
  );
}
