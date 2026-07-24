"use client";

import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent, useState, useTransition } from "react";
import {
  getNotificationsSnapshotAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/notifications/actions";
import { dispatchNotificationUnreadCountChanged } from "@/lib/notificationUnreadEvents";
import {
  notificationActorName,
  notificationActorHref,
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

function paymentDetail(notification: AppNotification) {
  const metadata = notification.metadata ?? {};
  const amount = metadata.amount;
  const message = metadata.message;
  const amountText = typeof amount === "number" && Number.isFinite(amount) ? `${new Intl.NumberFormat("ja-JP").format(amount)}円` : "";
  const messageText = typeof message === "string" && message.trim() ? message.trim() : "";
  return [amountText, messageText].filter(Boolean).join(" / ");
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setSyncedUnreadCount(nextCount: number) {
    const cleanCount = Math.max(0, nextCount);
    setUnreadCount(cleanCount);
    dispatchNotificationUnreadCountChanged(cleanCount);
  }

  function markLocalRead(notificationId: string, nextUnreadCount: number) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId && notification.read_at == null
          ? { ...notification, read_at: new Date().toISOString() }
          : notification
      )
    );
    setSyncedUnreadCount(nextUnreadCount);
  }

  function markAllLocalRead(nextUnreadCount: number) {
    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((notification) => ({ ...notification, read_at: notification.read_at ?? readAt })));
    setSyncedUnreadCount(nextUnreadCount);
  }

  async function syncFromServer() {
    let snapshot: Awaited<ReturnType<typeof getNotificationsSnapshotAction>>;

    try {
      snapshot = await getNotificationsSnapshotAction();
    } catch {
      setErrorMessage("通知の状態を再取得できませんでした。");
      dispatchNotificationUnreadCountChanged();
      return false;
    }

    if (snapshot.status !== "ok") {
      setErrorMessage(snapshot.message);
      dispatchNotificationUnreadCountChanged();
      return false;
    }

    setNotifications(snapshot.notifications);
    setSyncedUnreadCount(snapshot.unreadCount);
    return true;
  }

  function openNotification(notification: AppNotification, href: string) {
    if (pendingId != null || pendingAll) return false;

    const wasUnread = notification.read_at == null;

    setPendingId(notification.id);
    setErrorMessage(null);

    startTransition(() => {
      void (async () => {
        try {
          if (wasUnread) {
            const result = await markNotificationReadAction(notification.id);
            if (result.status === "ok") {
              markLocalRead(
                notification.id,
                typeof result.unreadCount === "number" ? result.unreadCount : Math.max(0, unreadCount - 1)
              );
            } else if (typeof result.unreadCount === "number") {
              setSyncedUnreadCount(result.unreadCount);
            } else {
              dispatchNotificationUnreadCountChanged();
            }
          }
        } catch {
          dispatchNotificationUnreadCountChanged();
        } finally {
          setPendingId(null);
          router.push(href);
        }
      })();
    });

    return true;
  }

  function handleNotificationLinkClick(event: MouseEvent<HTMLAnchorElement>, notification: AppNotification, href: string) {
    event.preventDefault();
    openNotification(notification, href);
  }

  function markAllRead() {
    if (unreadCount === 0 || pendingAll) return;

    setPendingAll(true);
    setErrorMessage(null);

    startTransition(() => {
      void (async () => {
        try {
          const result = await markAllNotificationsReadAction();

          if (result.status === "ok") {
            markAllLocalRead(typeof result.unreadCount === "number" ? result.unreadCount : 0);
            router.refresh();
            return;
          }

          setErrorMessage(result.message);
          if (typeof result.unreadCount === "number") {
            setSyncedUnreadCount(result.unreadCount);
          }
          await syncFromServer();
        } catch {
          setErrorMessage("通知を既読にできませんでした。");
          await syncFromServer();
        } finally {
          setPendingAll(false);
        }
      })();
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
      {errorMessage ? (
        <p role="alert" className="mt-3 rounded-[8px] border border-blush/20 bg-blushSoft/60 px-3 py-2 text-xs font-bold text-blush">
          {errorMessage}
        </p>
      ) : null}

      {notifications.length === 0 ? (
        <div className="mt-4 rounded-[8px] border border-line bg-white p-5 text-center shadow-sm">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-neutral-100 text-mute">
            <Bell aria-hidden="true" size={20} />
          </div>
          <p className="mt-3 text-sm font-black text-ink">通知はまだありません</p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-mute">反応やフォローが届くと、ここに表示されます。</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-2.5">
          {notifications.map((notification) => {
            const actorName = notificationActorName(notification);
            const unread = notification.read_at == null;
            const pending = pendingId === notification.id || pendingAll;
            const disabled = pendingId != null || pendingAll;
            const actorHref = notificationActorHref(notification);
            const contentHref = notificationHref(notification);
            const detail = paymentDetail(notification);
            const linkState = {
              "aria-disabled": disabled,
              tabIndex: disabled ? -1 : undefined,
            };

            return (
              <article
                key={notification.id}
                aria-busy={pending}
                className={
                  "flex min-h-[4.5rem] w-full items-start gap-3 rounded-[8px] border p-3 text-left " +
                  (unread ? "border-blush/20 bg-blushSoft/55" : "border-line bg-white")
                }
              >
                <Link
                  href={actorHref}
                  aria-label={`${actorName}のプロフィールを開く`}
                  onClick={(event) => {
                    if (disabled) {
                      event.preventDefault();
                      return;
                    }
                    handleNotificationLinkClick(event, notification, actorHref);
                  }}
                  {...linkState}
                  className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-ink text-[0.72rem] font-black text-white"
                >
                  {notification.actor_avatar_url ? <img src={notification.actor_avatar_url} alt="" className="h-full w-full object-cover" /> : initial(actorName)}
                  {unread ? <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border border-white bg-blush" /> : null}
                </Link>
                <span className="min-w-0 flex-1">
                  <Link
                    href={actorHref}
                    aria-label={`${actorName}のプロフィールを開く`}
                    onClick={(event) => {
                      if (disabled) {
                        event.preventDefault();
                        return;
                      }
                      handleNotificationLinkClick(event, notification, actorHref);
                    }}
                    {...linkState}
                    className="block truncate text-xs font-black text-ink"
                  >
                    {actorName}
                  </Link>
                  <Link
                    href={contentHref}
                    aria-label={notificationMessage(notification)}
                    onClick={(event) => {
                      if (disabled) {
                        event.preventDefault();
                        return;
                      }
                      handleNotificationLinkClick(event, notification, contentHref);
                    }}
                    {...linkState}
                    className="mt-1 block text-sm font-semibold leading-relaxed text-ink"
                   >
                     {notificationMessage(notification)}
                   </Link>
                   {detail ? <span className="mt-1 block break-words rounded-[6px] bg-white/70 px-2 py-1 text-[0.66rem] font-semibold text-mute">{detail}</span> : null}
                  <span className="mt-1 block text-[0.66rem] font-bold text-mute">{notificationTimeLabel(notification.created_at)}</span>
                </span>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
