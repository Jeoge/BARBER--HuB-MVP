import assert from "node:assert/strict";
import test from "node:test";
import {
  notificationActorHref,
  notificationHref,
  notificationMessage,
  type AppNotification,
} from "../lib/supabase/notifications.ts";

function notification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: "notification-id",
    recipient_id: "recipient-id",
    actor_id: "actor-id",
    notification_type: "snap_thanks",
    target_type: "snap",
    target_id: "target-id",
    destination_id: "destination-id",
    snap_id: "snap-id",
    article_id: null,
    snap_comment_id: null,
    article_comment_id: null,
    created_at: null,
    read_at: null,
    actor_display_name: "山田太郎",
    actor_avatar_url: null,
    ...overrides,
  };
}

test("reaction notifications keep separate actor and content destinations", () => {
  const item = notification();

  assert.equal(notificationActorHref(item), "/profiles/actor-id");
  assert.equal(notificationHref(item), "/posts/destination-id");
});

test("article and follow notification destinations are preserved", () => {
  const article = notification({
    notification_type: "article_like",
    target_type: "article",
    article_id: "article-id",
    destination_id: "article-id",
  });
  const follow = notification({
    notification_type: "follow",
    target_type: "profile",
    target_id: "actor-id",
    destination_id: "actor-id",
    snap_id: null,
  });

  assert.equal(notificationHref(article), "/articles/article-id");
  assert.equal(notificationActorHref(follow), "/profiles/actor-id");
  assert.equal(notificationHref(follow), "/profiles/actor-id");
  assert.equal(notificationMessage(follow), "山田太郎さんがあなたをフォローしました");
});

test("notification message uses a safe fallback for an unset actor profile", () => {
  const item = notification({ actor_display_name: "  " });

  assert.equal(notificationMessage(item), "プロフィール未設定のユーザーさんがあなたのSnapにThanksしました");
});

test("notification messages do not duplicate an existing さん suffix", () => {
  const item = notification({ actor_display_name: "山田さん" });

  assert.equal(notificationMessage(item), "山田さんがあなたのSnapにThanksしました");
});
