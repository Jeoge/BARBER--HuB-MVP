-- Follow notifications and private follower-list support.
-- Existing follows are intentionally not backfilled; only new INSERT/DELETE events are handled.

alter table public.notifications
  drop constraint if exists notifications_notification_type_check;

alter table public.notifications
  add constraint notifications_notification_type_check
  check (
    notification_type in (
      'snap_thanks',
      'snap_like',
      'snap_comment',
      'snap_comment_like',
      'article_thanks',
      'article_like',
      'article_comment',
      'follow'
    )
  );

alter table public.notifications
  drop constraint if exists notifications_target_type_check;

alter table public.notifications
  add constraint notifications_target_type_check
  check (target_type in ('snap', 'snap_comment', 'article', 'article_comment', 'profile'));

create or replace function public.notification_target_is_visible(p_notification public.notifications)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_notification.notification_type in ('snap_thanks', 'snap_like', 'snap_comment', 'snap_comment_like') then
      p_notification.snap_id is not null
      and exists (
        select 1
        from public.snaps
        where snaps.id = p_notification.snap_id
          and snaps.is_published = true
          and snaps.is_deleted = false
      )
    when p_notification.notification_type in ('article_thanks', 'article_like', 'article_comment') then
      p_notification.article_id is not null
      and exists (
        select 1
        from public.articles
        where articles.id::text = p_notification.article_id
          and articles.is_published = true
          and articles.is_deleted = false
      )
    when p_notification.notification_type = 'follow' then
      auth.uid() = p_notification.recipient_id
      and p_notification.target_type = 'profile'
      and p_notification.target_id = p_notification.actor_id::text
      and p_notification.destination_id = p_notification.actor_id::text
      and exists (
        select 1
        from public.profiles
        where profiles.id = p_notification.actor_id
      )
    else false
  end;
$$;

revoke all on function public.notification_target_is_visible(public.notifications) from public;

create or replace function public.notify_follow_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  follower_profile_id uuid;
  following_profile_id uuid;
begin
  select profiles.id
    into follower_profile_id
  from public.profiles
  where profiles.id = new.follower_id;

  select profiles.id
    into following_profile_id
  from public.profiles
  where profiles.id = new.following_id;

  if follower_profile_id is not null and following_profile_id is not null then
    perform public.create_notification_once(
      following_profile_id,
      follower_profile_id,
      'follow',
      'profile',
      follower_profile_id::text,
      follower_profile_id::text,
      null,
      null,
      null,
      null
    );
  end if;

  return new;
end;
$$;

create or replace function public.cleanup_follow_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notifications
  where recipient_id = old.following_id
    and actor_id = old.follower_id
    and notification_type = 'follow'
    and target_type = 'profile'
    and target_id = old.follower_id::text
    and destination_id = old.follower_id::text;

  return old;
end;
$$;

drop trigger if exists notify_follow_insert on public.follows;
create trigger notify_follow_insert
  after insert on public.follows
  for each row execute function public.notify_follow_insert();

drop trigger if exists cleanup_follow_notifications on public.follows;
create trigger cleanup_follow_notifications
  after delete on public.follows
  for each row execute function public.cleanup_follow_notifications();

revoke all on function public.notify_follow_insert() from public;
revoke all on function public.cleanup_follow_notifications() from public;
