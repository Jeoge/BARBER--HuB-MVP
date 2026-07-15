-- Snap comment likes and in-app notifications.
-- Individual like rows and notifications are private to the acting user/recipient.

create table if not exists public.snap_comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.snap_comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint snap_comment_likes_one_per_user unique (comment_id, user_id)
);

create index if not exists snap_comment_likes_comment_id_idx
  on public.snap_comment_likes(comment_id, created_at desc);

create index if not exists snap_comment_likes_user_id_idx
  on public.snap_comment_likes(user_id, created_at desc);

alter table public.snap_comment_likes enable row level security;

revoke all on public.snap_comment_likes from public;
grant select, insert, delete on public.snap_comment_likes to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'snap_comment_likes'
      and policyname = 'snap_comment_likes_select_own'
  ) then
    create policy "snap_comment_likes_select_own"
      on public.snap_comment_likes
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'snap_comment_likes'
      and policyname = 'snap_comment_likes_insert_own_not_comment_author'
  ) then
    create policy "snap_comment_likes_insert_own_not_comment_author"
      on public.snap_comment_likes
      for insert
      to authenticated
      with check (
        auth.uid() = user_id
        and exists (
          select 1
          from public.snap_comments
          inner join public.snaps on snaps.id = snap_comments.snap_id
          where snap_comments.id = snap_comment_likes.comment_id
            and snap_comments.user_id <> auth.uid()
            and snaps.is_published = true
            and snaps.is_deleted = false
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'snap_comment_likes'
      and policyname = 'snap_comment_likes_delete_own'
  ) then
    create policy "snap_comment_likes_delete_own"
      on public.snap_comment_likes
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

create or replace function public.get_public_snap_comment_like_counts(p_comment_ids uuid[])
returns table (
  comment_id uuid,
  like_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    snap_comments.id as comment_id,
    count(snap_comment_likes.id)::bigint as like_count
  from public.snap_comments
  inner join public.snaps on snaps.id = snap_comments.snap_id
  left join public.snap_comment_likes
    on snap_comment_likes.comment_id = snap_comments.id
  where snap_comments.id = any(coalesce(p_comment_ids, array[]::uuid[]))
    and snaps.is_published = true
    and snaps.is_deleted = false
  group by snap_comments.id;
$$;

revoke all on function public.get_public_snap_comment_like_counts(uuid[]) from public;
grant execute on function public.get_public_snap_comment_like_counts(uuid[]) to anon, authenticated;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null check (
    notification_type in (
      'snap_thanks',
      'snap_like',
      'snap_comment',
      'snap_comment_like',
      'article_thanks',
      'article_like',
      'article_comment'
    )
  ),
  target_type text not null check (target_type in ('snap', 'snap_comment', 'article', 'article_comment')),
  target_id text not null check (length(btrim(target_id)) > 0),
  destination_id text not null check (length(btrim(destination_id)) > 0),
  snap_id uuid references public.snaps(id) on delete cascade,
  article_id text,
  snap_comment_id uuid references public.snap_comments(id) on delete cascade,
  article_comment_id uuid references public.article_comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint notifications_no_self_actor check (recipient_id <> actor_id)
);

create unique index if not exists notifications_unique_event_idx
  on public.notifications(recipient_id, actor_id, notification_type, target_type, target_id);

create index if not exists notifications_recipient_created_idx
  on public.notifications(recipient_id, created_at desc);

create index if not exists notifications_recipient_unread_idx
  on public.notifications(recipient_id, read_at, created_at desc);

create index if not exists notifications_type_target_idx
  on public.notifications(notification_type, target_id);

create index if not exists notifications_snap_id_idx
  on public.notifications(snap_id)
  where snap_id is not null;

create index if not exists notifications_article_id_idx
  on public.notifications(article_id)
  where article_id is not null;

alter table public.notifications enable row level security;

revoke all on public.notifications from public;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notifications_select_recipient'
  ) then
    create policy "notifications_select_recipient"
      on public.notifications
      for select
      to authenticated
      using (auth.uid() = recipient_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'notifications_update_read_at_recipient'
  ) then
    create policy "notifications_update_read_at_recipient"
      on public.notifications
      for update
      to authenticated
      using (auth.uid() = recipient_id)
      with check (auth.uid() = recipient_id);
  end if;
end $$;

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
    else false
  end;
$$;

revoke all on function public.notification_target_is_visible(public.notifications) from public;

create or replace function public.list_my_notifications(p_limit integer default 30)
returns table (
  id uuid,
  recipient_id uuid,
  actor_id uuid,
  notification_type text,
  target_type text,
  target_id text,
  destination_id text,
  snap_id uuid,
  article_id text,
  snap_comment_id uuid,
  article_comment_id uuid,
  created_at timestamptz,
  read_at timestamptz,
  actor_display_name text,
  actor_avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    notifications.id,
    notifications.recipient_id,
    notifications.actor_id,
    notifications.notification_type,
    notifications.target_type,
    notifications.target_id,
    notifications.destination_id,
    notifications.snap_id,
    notifications.article_id,
    notifications.snap_comment_id,
    notifications.article_comment_id,
    notifications.created_at,
    notifications.read_at,
    profiles.display_name as actor_display_name,
    profiles.avatar_url as actor_avatar_url
  from public.notifications
  left join public.profiles on profiles.id = notifications.actor_id
  where notifications.recipient_id = auth.uid()
    and public.notification_target_is_visible(notifications)
  order by notifications.created_at desc
  limit least(greatest(coalesce(p_limit, 30), 1), 100);
$$;

revoke all on function public.list_my_notifications(integer) from public;
revoke all on function public.list_my_notifications(integer) from anon;
grant execute on function public.list_my_notifications(integer) to authenticated;

create or replace function public.get_unread_notification_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.notifications
  where notifications.recipient_id = auth.uid()
    and notifications.read_at is null
    and public.notification_target_is_visible(notifications);
$$;

revoke all on function public.get_unread_notification_count() from public;
revoke all on function public.get_unread_notification_count() from anon;
grant execute on function public.get_unread_notification_count() to authenticated;

create or replace function public.create_notification_once(
  p_recipient_id uuid,
  p_actor_id uuid,
  p_notification_type text,
  p_target_type text,
  p_target_id text,
  p_destination_id text,
  p_snap_id uuid default null,
  p_article_id text default null,
  p_snap_comment_id uuid default null,
  p_article_comment_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_recipient_id is null
    or p_actor_id is null
    or p_recipient_id = p_actor_id
    or nullif(btrim(coalesce(p_target_id, '')), '') is null
    or nullif(btrim(coalesce(p_destination_id, '')), '') is null
  then
    return;
  end if;

  insert into public.notifications (
    recipient_id,
    actor_id,
    notification_type,
    target_type,
    target_id,
    destination_id,
    snap_id,
    article_id,
    snap_comment_id,
    article_comment_id
  )
  values (
    p_recipient_id,
    p_actor_id,
    p_notification_type,
    p_target_type,
    p_target_id,
    p_destination_id,
    p_snap_id,
    p_article_id,
    p_snap_comment_id,
    p_article_comment_id
  )
  on conflict (recipient_id, actor_id, notification_type, target_type, target_id) do nothing;
end;
$$;

revoke all on function public.create_notification_once(uuid, uuid, text, text, text, text, uuid, text, uuid, uuid) from public;

create or replace function public.notify_snap_reaction_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  snap_owner_id uuid;
begin
  if new.reaction_type not in ('thanks', 'like') then
    return new;
  end if;

  select snaps.author_id
    into snap_owner_id
  from public.snaps
  where snaps.id = new.snap_id
    and snaps.is_published = true
    and snaps.is_deleted = false;

  perform public.create_notification_once(
    snap_owner_id,
    new.user_id,
    case when new.reaction_type = 'thanks' then 'snap_thanks' else 'snap_like' end,
    'snap',
    new.snap_id::text,
    new.snap_id::text,
    new.snap_id,
    null,
    null,
    null
  );

  return new;
end;
$$;

create or replace function public.notify_snap_reaction_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.reaction_type in ('thanks', 'like') then
    delete from public.notifications
    where actor_id = old.user_id
      and notification_type = case when old.reaction_type = 'thanks' then 'snap_thanks' else 'snap_like' end
      and target_type = 'snap'
      and target_id = old.snap_id::text;
  end if;

  return old;
end;
$$;

drop trigger if exists notify_snap_reaction_insert on public.snap_reactions;
create trigger notify_snap_reaction_insert
  after insert on public.snap_reactions
  for each row execute function public.notify_snap_reaction_insert();

drop trigger if exists notify_snap_reaction_delete on public.snap_reactions;
create trigger notify_snap_reaction_delete
  after delete on public.snap_reactions
  for each row execute function public.notify_snap_reaction_delete();

create or replace function public.notify_snap_comment_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  snap_owner_id uuid;
begin
  select snaps.author_id
    into snap_owner_id
  from public.snaps
  where snaps.id = new.snap_id
    and snaps.is_published = true
    and snaps.is_deleted = false;

  perform public.create_notification_once(
    snap_owner_id,
    new.user_id,
    'snap_comment',
    'snap_comment',
    new.id::text,
    new.snap_id::text,
    new.snap_id,
    null,
    new.id,
    null
  );

  return new;
end;
$$;

drop trigger if exists notify_snap_comment_insert on public.snap_comments;
create trigger notify_snap_comment_insert
  after insert on public.snap_comments
  for each row execute function public.notify_snap_comment_insert();

create or replace function public.notify_snap_comment_like_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  comment_owner_id uuid;
  comment_snap_id uuid;
begin
  select snap_comments.user_id, snap_comments.snap_id
    into comment_owner_id, comment_snap_id
  from public.snap_comments
  inner join public.snaps on snaps.id = snap_comments.snap_id
  where snap_comments.id = new.comment_id
    and snaps.is_published = true
    and snaps.is_deleted = false;

  perform public.create_notification_once(
    comment_owner_id,
    new.user_id,
    'snap_comment_like',
    'snap_comment',
    new.comment_id::text,
    comment_snap_id::text,
    comment_snap_id,
    null,
    new.comment_id,
    null
  );

  return new;
end;
$$;

create or replace function public.notify_snap_comment_like_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notifications
  where actor_id = old.user_id
    and notification_type = 'snap_comment_like'
    and target_type = 'snap_comment'
    and target_id = old.comment_id::text;

  return old;
end;
$$;

drop trigger if exists notify_snap_comment_like_insert on public.snap_comment_likes;
create trigger notify_snap_comment_like_insert
  after insert on public.snap_comment_likes
  for each row execute function public.notify_snap_comment_like_insert();

drop trigger if exists notify_snap_comment_like_delete on public.snap_comment_likes;
create trigger notify_snap_comment_like_delete
  after delete on public.snap_comment_likes
  for each row execute function public.notify_snap_comment_like_delete();

create or replace function public.notify_article_reaction_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  article_owner_id uuid;
begin
  if new.reaction_type not in ('thanks', 'like') then
    return new;
  end if;

  select articles.author_id
    into article_owner_id
  from public.articles
  where articles.id::text = new.article_id
    and articles.is_published = true
    and articles.is_deleted = false;

  perform public.create_notification_once(
    article_owner_id,
    new.user_id,
    case when new.reaction_type = 'thanks' then 'article_thanks' else 'article_like' end,
    'article',
    new.article_id,
    new.article_id,
    null,
    new.article_id,
    null,
    null
  );

  return new;
end;
$$;

create or replace function public.notify_article_reaction_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.reaction_type in ('thanks', 'like') then
    delete from public.notifications
    where actor_id = old.user_id
      and notification_type = case when old.reaction_type = 'thanks' then 'article_thanks' else 'article_like' end
      and target_type = 'article'
      and target_id = old.article_id;
  end if;

  return old;
end;
$$;

drop trigger if exists notify_article_reaction_insert on public.article_reactions;
create trigger notify_article_reaction_insert
  after insert on public.article_reactions
  for each row execute function public.notify_article_reaction_insert();

drop trigger if exists notify_article_reaction_delete on public.article_reactions;
create trigger notify_article_reaction_delete
  after delete on public.article_reactions
  for each row execute function public.notify_article_reaction_delete();

create or replace function public.notify_article_comment_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  article_owner_id uuid;
begin
  select articles.author_id
    into article_owner_id
  from public.articles
  where articles.id::text = new.article_id
    and articles.is_published = true
    and articles.is_deleted = false;

  perform public.create_notification_once(
    article_owner_id,
    new.user_id,
    'article_comment',
    'article_comment',
    new.id::text,
    new.article_id,
    null,
    new.article_id,
    null,
    new.id
  );

  return new;
end;
$$;

create or replace function public.cleanup_article_comment_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.notifications
    where article_comment_id = old.id;
    return old;
  end if;

  if new.is_deleted = true and old.is_deleted is distinct from new.is_deleted then
    delete from public.notifications
    where article_comment_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists notify_article_comment_insert on public.article_comments;
create trigger notify_article_comment_insert
  after insert on public.article_comments
  for each row execute function public.notify_article_comment_insert();

drop trigger if exists cleanup_article_comment_notifications_delete on public.article_comments;
create trigger cleanup_article_comment_notifications_delete
  after delete on public.article_comments
  for each row execute function public.cleanup_article_comment_notifications();

drop trigger if exists cleanup_article_comment_notifications_update on public.article_comments;
create trigger cleanup_article_comment_notifications_update
  after update of is_deleted on public.article_comments
  for each row execute function public.cleanup_article_comment_notifications();

create or replace function public.cleanup_hidden_snap_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.is_deleted = true or new.is_published = false)
    and (
      old.is_deleted is distinct from new.is_deleted
      or old.is_published is distinct from new.is_published
    )
  then
    delete from public.notifications
    where snap_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists cleanup_hidden_snap_notifications on public.snaps;
create trigger cleanup_hidden_snap_notifications
  after update of is_deleted, is_published on public.snaps
  for each row execute function public.cleanup_hidden_snap_notifications();

create or replace function public.cleanup_hidden_article_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.is_deleted = true or new.is_published = false)
    and (
      old.is_deleted is distinct from new.is_deleted
      or old.is_published is distinct from new.is_published
    )
  then
    delete from public.notifications
    where article_id = new.id::text;
  end if;

  return new;
end;
$$;

drop trigger if exists cleanup_hidden_article_notifications on public.articles;
create trigger cleanup_hidden_article_notifications
  after update of is_deleted, is_published on public.articles
  for each row execute function public.cleanup_hidden_article_notifications();

revoke all on function public.notify_snap_reaction_insert() from public;
revoke all on function public.notify_snap_reaction_delete() from public;
revoke all on function public.notify_snap_comment_insert() from public;
revoke all on function public.notify_snap_comment_like_insert() from public;
revoke all on function public.notify_snap_comment_like_delete() from public;
revoke all on function public.notify_article_reaction_insert() from public;
revoke all on function public.notify_article_reaction_delete() from public;
revoke all on function public.notify_article_comment_insert() from public;
revoke all on function public.cleanup_article_comment_notifications() from public;
revoke all on function public.cleanup_hidden_snap_notifications() from public;
revoke all on function public.cleanup_hidden_article_notifications() from public;
