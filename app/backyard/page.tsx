import { SignupRequiredCard } from "@/components/AuthGate";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";

export default function BackyardPage() {
  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="BARBER BACKYARD"
        title="表では学び、裏では本音を話す。"
        body="理容師だけのバックヤード。安心して使える場所にするため、会員登録が必要です。"
      />
      <SignupRequiredCard kind="backyard" />
    </PageChrome>
  );
}
