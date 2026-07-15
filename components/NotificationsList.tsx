"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/notifications/actions";
import {
  notificationActorName,
  notificationHref,
  notificationMessage,
  notificationTimeLabel,
  type AppNotification,
} from "@/lib/supabase/notifications";

function initial(name: string) {
  return name.trim().slice(0, 1).toUpperCase();
}

function unreadLabel(count: number) {
  if (count <= 0) return "未読なし";
  if (count > 99) return "未読 99+";
  return `未読 ${count}`;
}

export function NotificationsList({
  notifications: initialNotifications,
  unreadCount: initialUnreadCount,
}: {
  notifications: AppNotification[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingAll, setPendingAll] = useState(false);
  const [isPending, startTransition] = useTransition();

  function markLocalRead(notificationId: string) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId && notification.read_at == null
          ? { ...notification, read_at: new Date().toISOString() }
          : notification
      )
    );
    setUnreadCount((current) => Math.max(0, current - 1));
  }

  function openNotification(notification: AppNotification) {
    const href = notificationHref(notification);
    const wasUnread = notification.read_at == null;

    setPendingId(notification.id);
    if (wasUnread) markLocalRead(notification.id);

    startTransition(async () => {
      try {
        await markNotificationReadAction(notification.id);
      } finally {
        setPendingId(null);
        router.push(href);
      }
    });
  }

  function markAllRead() {
    if (unreadCount === 0 || pendingAll) return;

    setPendingAll(true);
    setNotifications((current) => current.map((notification) => ({ ...notification, read_at: notification.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);

    startTransition(async () => {
      try {
        await markAllNotificationsReadAction();
      } finally {
        setPendingAll(false);
        router.refresh();
      }
    });
  }

  return (
    <section className="px-4 pt-5">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[0.68rem] font-black text-mute">
          {unreadLabel(unreadCount)}
        </span>
        <button
          type="button"
          onClick={markAllRead}
          disabled={unreadCount === 0 || pendingAll || isPending}
          aria-busy={pendingAll}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] border border-line bg-white px-3 text-[0.72rem] font-black text-ink transition active:scale-[0.98] disabled:active:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCheck aria-hidden="true" size={15} />
          すべて既読
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="mt-4 rounded-[8px] border border-line bg-white p-5 text-center shadow-sm">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-neutral-100 text-mute">
            <Bell aria-hidden="true" size={20} />
          </div>
          <p className="mt-3 text-sm font-black text-ink">通知はまだありません</p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-mute">Thanksやコメントが届くとここに表示されます。</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-2.5">
          {notifications.map((notification) => {
            const actorName = notificationActorName(notification);
            const unread = notification.read_at == null;
            const pending = pendingId === notification.id;

            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => openNotification(notification)}
                disabled={pending}
                aria-busy={pending}
                className={
                  "flex min-h-[4.5rem] w-full items-start gap-3 rounded-[8px] border p-3 text-left transition active:scale-[0.99] disabled:active:scale-100 disabled:cursor-wait " +
                  (unread ? "border-blush/20 bg-blushSoft/55" : "border-line bg-white")
                }
              >
                <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-ink text-[0.72rem] font-black text-white">
                  {notification.actor_avatar_url ? (
                    <img src={notification.actor_avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initial(actorName)
                  )}
                  {unread ? <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border border-white bg-blush" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-black text-ink">{actorName}</span>
                  <span className="mt-1 block text-sm font-semibold leading-relaxed text-ink">{notificationMessage(notification)}</span>
                  <span className="mt-1 block text-[0.66rem] font-bold text-mute">{notificationTimeLabel(notification.created_at)}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
