"use server";

import { revalidatePath } from "next/cache";
import {
  getUnreadNotificationCountResult,
  isMissingNotificationsError,
  listMyNotifications,
  type AppNotification,
} from "@/lib/supabase/notifications";
import { createClient } from "@/lib/supabase/server";

export type NotificationActionResult =
  | { status: "ok"; unreadCount?: number }
  | { status: "error"; message: string; unreadCount?: number };

export type NotificationsSnapshotResult =
  | { status: "ok"; notifications: AppNotification[]; unreadCount: number }
  | { status: "error"; message: string };

const NOTIFICATION_SNAPSHOT_ERROR_MESSAGE = "通知の状態を再取得できませんでした。";

export async function markNotificationReadAction(notificationId: string): Promise<NotificationActionResult> {
  const cleanId = notificationId.trim();
  if (!cleanId) return { status: "error", message: "通知が不明です。" };

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Notification read auth lookup failed", { message: userError.message });
    }

    return { status: "error", message: "ログインが必要です。" };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", cleanId)
    .eq("recipient_id", user.id)
    .is("read_at", null);

  if (error) {
    if (isMissingNotificationsError(error)) return { status: "ok", unreadCount: 0 };

    console.error("Notification read update failed", {
      notificationId: cleanId,
      userId: user.id,
      message: error.message,
    });
    return { status: "error", message: "通知を既読にできませんでした。" };
  }

  revalidatePath("/notifications");
  const unreadCountResult = await getUnreadNotificationCountResult(supabase);
  if (unreadCountResult.status === "error") return { status: "ok" };

  return { status: "ok", unreadCount: unreadCountResult.count };
}

export async function markAllNotificationsReadAction(): Promise<NotificationActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Notification read-all auth lookup failed", { message: userError.message });
    }

    return { status: "error", message: "ログインが必要です。" };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  if (error) {
    if (isMissingNotificationsError(error)) return { status: "ok", unreadCount: 0 };

    console.error("Notifications read-all update failed", {
      userId: user.id,
      message: error.message,
    });
    return { status: "error", message: "通知を既読にできませんでした。" };
  }

  revalidatePath("/notifications");
  const unreadCountResult = await getUnreadNotificationCountResult(supabase);
  if (unreadCountResult.status === "error") return { status: "ok" };

  return { status: "ok", unreadCount: unreadCountResult.count };
}

export async function getNotificationsSnapshotAction(): Promise<NotificationsSnapshotResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (user == null) {
    if (userError) {
      console.error("Notification snapshot auth lookup failed", { message: userError.message });
    }

    return { status: "error", message: NOTIFICATION_SNAPSHOT_ERROR_MESSAGE };
  }

  try {
    const [notificationsResult, unreadCountResult] = await Promise.all([
      listMyNotifications(supabase, 30),
      getUnreadNotificationCountResult(supabase),
    ]);

    if (notificationsResult.error != null && !notificationsResult.unavailable) {
      return { status: "error", message: NOTIFICATION_SNAPSHOT_ERROR_MESSAGE };
    }

    if (unreadCountResult.status === "error") {
      return { status: "error", message: NOTIFICATION_SNAPSHOT_ERROR_MESSAGE };
    }

    return {
      status: "ok",
      notifications: notificationsResult.notifications,
      unreadCount: unreadCountResult.count,
    };
  } catch (error) {
    console.error("Notification snapshot lookup failed", { error });
    return { status: "error", message: NOTIFICATION_SNAPSHOT_ERROR_MESSAGE };
  }
}
