import { redirect } from "next/navigation";
import { NotificationsList } from "@/components/NotificationsList";
import { PageChrome } from "@/components/PageChrome";
import { PageHeaderBlock } from "@/components/PageHeaderBlock";
import { pathWithParams } from "@/lib/auth/redirects";
import { getUnreadNotificationCount, listMyNotifications } from "@/lib/supabase/notifications";
import { createClient } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user == null) {
    redirect(pathWithParams("/login", { next: "/notifications", message: "通知を見るにはログインしてください。" }));
  }

  const [{ notifications }, unreadCount] = await Promise.all([
    listMyNotifications(supabase, 30),
    getUnreadNotificationCount(supabase),
  ]);

  return (
    <PageChrome>
      <PageHeaderBlock
        eyebrow="NOTIFICATIONS"
        title="通知"
        body="あなたへのThanks、いいね、コメント、フォローを確認できます。"
      />
      <NotificationsList notifications={notifications} unreadCount={unreadCount} />
    </PageChrome>
  );
}
