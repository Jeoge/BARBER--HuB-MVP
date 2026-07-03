import { SignupRequiredCard } from "@/components/AuthGate";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";

export default function NotificationsPage() {
  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="NOTIFICATIONS"
        title="通知"
        body="Thanks、コメント、AI編集部の更新をまとめて確認できます。"
      />
      <SignupRequiredCard />
    </PageChrome>
  );
}
