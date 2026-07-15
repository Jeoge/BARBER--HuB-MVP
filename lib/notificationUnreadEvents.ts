"use client";

export const NOTIFICATION_UNREAD_COUNT_CHANGED = "barberhub:notification-unread-count-changed";

export type NotificationUnreadCountChangedDetail = {
  unreadCount?: number;
};

export function dispatchNotificationUnreadCountChanged(unreadCount?: number) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<NotificationUnreadCountChangedDetail>(NOTIFICATION_UNREAD_COUNT_CHANGED, {
      detail: typeof unreadCount === "number" ? { unreadCount } : {},
    })
  );
}
