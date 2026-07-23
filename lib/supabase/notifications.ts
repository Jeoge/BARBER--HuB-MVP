import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationType =
  | "snap_thanks"
  | "snap_like"
  | "snap_comment"
  | "snap_comment_like"
  | "article_thanks"
  | "article_like"
  | "article_comment"
  | "follow";

export type AppNotification = {
  id: string;
  recipient_id: string;
  actor_id: string;
  notification_type: NotificationType;
  target_type: "snap" | "snap_comment" | "article" | "article_comment" | "profile";
  target_id: string;
  destination_id: string;
  snap_id: string | null;
  article_id: string | null;
  snap_comment_id: string | null;
  article_comment_id: string | null;
  created_at: string | null;
  read_at: string | null;
  actor_display_name: string | null;
  actor_avatar_url: string | null;
};

type NotificationRpcRow = AppNotification & {
  notification_type: string;
  target_type: string;
};

export type ListMyNotificationsResult =
  | { status: "ok"; notifications: AppNotification[]; error: null; unavailable: false }
  | { status: "unavailable"; notifications: AppNotification[]; error: null; unavailable: true }
  | { status: "error"; notifications: AppNotification[]; error: unknown; unavailable: false };

export type UnreadNotificationCountResult =
  | { status: "ok"; count: number; error: null; unavailable: false }
  | { status: "unavailable"; count: 0; error: null; unavailable: true }
  | { status: "error"; count: null; error: unknown; unavailable: false };

function errorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "";
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  if (error instanceof Error) return error.message;
  return String(error || "");
}

export function isMissingNotificationsError(error: unknown) {
  const message = errorMessage(error).toLowerCase();

  return (
    errorCode(error) === "PGRST202" ||
    errorCode(error) === "PGRST205" ||
    ((message.includes("notifications") || message.includes("list_my_notifications") || message.includes("get_unread_notification_count")) &&
      (message.includes("could not find") ||
        message.includes("schema cache") ||
        message.includes("does not exist") ||
        message.includes("relation") ||
        message.includes("not found")))
  );
}

function normalizeNotification(row: NotificationRpcRow): AppNotification {
  return {
    ...row,
    notification_type: row.notification_type as NotificationType,
    target_type: row.target_type as AppNotification["target_type"],
    snap_id: row.snap_id ?? null,
    article_id: row.article_id ?? null,
    snap_comment_id: row.snap_comment_id ?? null,
    article_comment_id: row.article_comment_id ?? null,
    actor_display_name: row.actor_display_name ?? null,
    actor_avatar_url: row.actor_avatar_url ?? null,
    read_at: row.read_at ?? null,
    created_at: row.created_at ?? null,
  };
}

export async function listMyNotifications(supabase: SupabaseClient, limit = 30): Promise<ListMyNotificationsResult> {
  const { data, error } = await supabase.rpc("list_my_notifications", { p_limit: limit });

  if (error) {
    if (!isMissingNotificationsError(error)) {
      console.error("Notifications list RPC failed", { message: error.message });
      return { status: "error", notifications: [] as AppNotification[], error, unavailable: false };
    }

    return { status: "unavailable", notifications: [] as AppNotification[], error: null, unavailable: true };
  }

  return {
    status: "ok",
    notifications: ((data ?? []) as NotificationRpcRow[]).map(normalizeNotification),
    error: null,
    unavailable: false,
  };
}

export async function getUnreadNotificationCountResult(supabase: SupabaseClient): Promise<UnreadNotificationCountResult> {
  const { data, error } = await supabase.rpc("get_unread_notification_count");

  if (error) {
    if (!isMissingNotificationsError(error)) {
      console.error("Unread notification count RPC failed", { message: error.message });
      return { status: "error", count: null, error, unavailable: false };
    }

    return { status: "unavailable", count: 0, error: null, unavailable: true };
  }

  return { status: "ok", count: Number(data ?? 0), error: null, unavailable: false };
}

export async function getUnreadNotificationCount(supabase: SupabaseClient) {
  const result = await getUnreadNotificationCountResult(supabase);
  return result.status === "error" ? 0 : result.count;
}

export function notificationActorName(notification: Pick<AppNotification, "actor_display_name">) {
  return notification.actor_display_name?.trim() || "プロフィール未設定のユーザー";
}

function notificationActorSentenceName(notification: Pick<AppNotification, "actor_display_name">) {
  const name = notificationActorName(notification);
  return name.endsWith("さん") ? name : `${name}さん`;
}

export function notificationMessage(notification: AppNotification) {
  const name = notificationActorSentenceName(notification);

  switch (notification.notification_type) {
    case "snap_thanks":
      return `${name}があなたのSnapにThanksしました`;
    case "snap_like":
      return `${name}があなたのSnapにいいねしました`;
    case "snap_comment":
      return `${name}があなたのSnapにコメントしました`;
    case "snap_comment_like":
      return `${name}があなたのコメントにいいねしました`;
    case "article_thanks":
      return `${name}があなたの記事にThanksしました`;
    case "article_like":
      return `${name}があなたの記事にいいねしました`;
    case "article_comment":
      return `${name}があなたの記事にコメントしました`;
    case "follow":
      return `${name}があなたをフォローしました`;
    default:
      return `${name}から新しい反応があります`;
  }
}

export function notificationActorHref(notification: Pick<AppNotification, "actor_id">) {
  return `/profiles/${notification.actor_id}`;
}

export function notificationHref(notification: AppNotification) {
  switch (notification.notification_type) {
    case "snap_comment_like":
      return `/posts/${notification.destination_id}#snap-comment-${notification.target_id}`;
    case "snap_comment":
    case "snap_thanks":
    case "snap_like":
      return `/posts/${notification.destination_id}`;
    case "article_comment":
      return `/articles/${notification.destination_id}#article-comments`;
    case "article_thanks":
    case "article_like":
      return `/articles/${notification.destination_id}`;
    case "follow":
      return notificationActorHref(notification);
    default:
      return "/";
  }
}

export function notificationTimeLabel(createdAt: string | null) {
  if (!createdAt) return "";
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return "";

  const diffMs = Date.now() - created.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;

  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}時間前`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "昨日";
  if (days < 7) return `${days}日前`;

  return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric" }).format(created);
}
