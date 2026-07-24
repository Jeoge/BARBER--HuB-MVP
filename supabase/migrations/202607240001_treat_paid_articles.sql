-- Treat, paid articles, Stripe Connect records, and Back Room comment likes.
-- This migration is additive: existing articles.category, reactions, and notifications remain intact.

alter table public.articles
  add column if not exists access_type text not null default 'free',
  add column if not exists price_amount integer,
  add column if not exists currency text not null default 'jpy';

alter table public.articles
  drop constraint if exists articles_access_type_check;
alter table public.articles
  add constraint articles_access_type_check check (access_type in ('free', 'paid'));

alter table public.articles
  drop constraint if exists articles_paid_price_check;
alter table public.articles
  add constraint articles_paid_price_check check (
    (access_type = 'free' and price_amount is null)
    or (access_type = 'paid' and price_amount in (100, 300, 500, 1000))
  );

alter table public.articles
  drop constraint if exists articles_currency_check;
alter table public.articles
  add constraint articles_currency_check check (currency = 'jpy');

create table if not exists public.article_category_assignments (
  article_id uuid not null references public.articles(id) on delete cascade,
  category text not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (article_id, category),
  constraint article_category_assignments_category_check check (char_length(trim(category)) between 1 and 80)
);

create index if not exists article_category_assignments_category_article_idx
  on public.article_category_assignments(category, article_id);

insert into public.article_category_assignments(article_id, category)
select id, category
from public.articles
where category is not null and length(trim(category)) > 0
on conflict (article_id, category) do nothing;

alter table public.article_category_assignments enable row level security;
revoke all on public.article_category_assignments from anon, authenticated;
grant select on public.article_category_assignments to anon, authenticated;
grant insert, update, delete on public.article_category_assignments to authenticated;

drop policy if exists "article_category_assignments_select_visible" on public.article_category_assignments;
create policy "article_category_assignments_select_visible"
  on public.article_category_assignments for select
  using (
    exists (
      select 1 from public.articles
      where articles.id = article_category_assignments.article_id
        and ((articles.is_published = true and articles.is_deleted = false) or articles.author_id = auth.uid())
    )
  );

drop policy if exists "article_category_assignments_insert_own" on public.article_category_assignments;
create policy "article_category_assignments_insert_own"
  on public.article_category_assignments for insert to authenticated
  with check (
    exists (
      select 1 from public.articles
      where articles.id = article_category_assignments.article_id and articles.author_id = auth.uid()
    )
  );

drop policy if exists "article_category_assignments_delete_own" on public.article_category_assignments;
create policy "article_category_assignments_delete_own"
  on public.article_category_assignments for delete to authenticated
  using (
    exists (
      select 1 from public.articles
      where articles.id = article_category_assignments.article_id and articles.author_id = auth.uid()
    )
  );

drop policy if exists "article_category_assignments_update_own" on public.article_category_assignments;
create policy "article_category_assignments_update_own"
  on public.article_category_assignments for update to authenticated
  using (
    exists (
      select 1 from public.articles
      where articles.id = article_category_assignments.article_id and articles.author_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.articles
      where articles.id = article_category_assignments.article_id and articles.author_id = auth.uid()
    )
  );

create table if not exists public.stripe_connected_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_account_id text not null unique,
  onboarding_status text not null default 'not_started',
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  requirements_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint stripe_connected_accounts_status_check check (onboarding_status in ('not_started', 'pending', 'under_review', 'enabled', 'restricted'))
);

alter table public.stripe_connected_accounts enable row level security;
revoke all on public.stripe_connected_accounts from anon, authenticated;
grant select on public.stripe_connected_accounts to authenticated;

drop policy if exists "stripe_connected_accounts_select_own" on public.stripe_connected_accounts;
create policy "stripe_connected_accounts_select_own"
  on public.stripe_connected_accounts for select to authenticated
  using (user_id = auth.uid());

create table if not exists public.article_paid_sections (
  article_id uuid primary key references public.articles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint article_paid_sections_body_check check (length(trim(body)) > 0)
);

create table if not exists public.paid_article_purchases (
  id uuid primary key,
  article_id uuid not null references public.articles(id) on delete restrict,
  buyer_id uuid not null references auth.users(id) on delete restrict,
  seller_id uuid not null references auth.users(id) on delete restrict,
  price_amount integer not null check (price_amount in (100, 300, 500, 1000)),
  currency text not null default 'jpy' check (currency = 'jpy'),
  platform_fee_amount integer not null check (platform_fee_amount >= 0),
  seller_amount integer not null check (seller_amount >= 0),
  stripe_destination_account_id text not null,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  status text not null default 'pending',
  purchased_at timestamptz,
  refunded_at timestamptz,
  refunded_amount integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint paid_article_purchases_status_check check (status in ('pending', 'completed', 'expired', 'failed', 'partially_refunded', 'refunded')),
  constraint paid_article_purchases_not_self_check check (buyer_id <> seller_id),
  constraint paid_article_purchases_amount_check check (platform_fee_amount < price_amount and seller_amount = price_amount - platform_fee_amount and refunded_amount between 0 and price_amount)
);

create unique index if not exists paid_article_purchases_active_one_per_buyer_article_idx
  on public.paid_article_purchases(article_id, buyer_id)
  where status in ('pending', 'completed', 'partially_refunded');
create index if not exists paid_article_purchases_buyer_created_idx
  on public.paid_article_purchases(buyer_id, created_at desc);
create index if not exists paid_article_purchases_seller_created_idx
  on public.paid_article_purchases(seller_id, created_at desc);

alter table public.paid_article_purchases enable row level security;
revoke all on public.paid_article_purchases from anon, authenticated;
grant select on public.paid_article_purchases to authenticated;
drop policy if exists "paid_article_purchases_select_participant" on public.paid_article_purchases;
create policy "paid_article_purchases_select_participant"
  on public.paid_article_purchases for select to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid());

alter table public.article_paid_sections enable row level security;
revoke all on public.article_paid_sections from anon, authenticated;
grant select on public.article_paid_sections to authenticated;
grant insert, update, delete on public.article_paid_sections to authenticated;
drop policy if exists "article_paid_sections_select_entitled" on public.article_paid_sections;
create policy "article_paid_sections_select_entitled"
  on public.article_paid_sections for select to authenticated
  using (
    exists (select 1 from public.articles where articles.id = article_paid_sections.article_id and articles.author_id = auth.uid())
    or exists (
      select 1 from public.paid_article_purchases
      where paid_article_purchases.article_id = article_paid_sections.article_id
        and paid_article_purchases.buyer_id = auth.uid()
        and paid_article_purchases.status in ('completed', 'partially_refunded')
    )
  );

drop policy if exists "article_paid_sections_insert_own" on public.article_paid_sections;
create policy "article_paid_sections_insert_own"
  on public.article_paid_sections for insert to authenticated
  with check (
    exists (select 1 from public.articles where articles.id = article_paid_sections.article_id and articles.author_id = auth.uid())
  );
drop policy if exists "article_paid_sections_update_own" on public.article_paid_sections;
create policy "article_paid_sections_update_own"
  on public.article_paid_sections for update to authenticated
  using (
    exists (select 1 from public.articles where articles.id = article_paid_sections.article_id and articles.author_id = auth.uid())
  )
  with check (
    exists (select 1 from public.articles where articles.id = article_paid_sections.article_id and articles.author_id = auth.uid())
  );
drop policy if exists "article_paid_sections_delete_own" on public.article_paid_sections;
create policy "article_paid_sections_delete_own"
  on public.article_paid_sections for delete to authenticated
  using (
    exists (select 1 from public.articles where articles.id = article_paid_sections.article_id and articles.author_id = auth.uid())
  );

create table if not exists public.content_treats (
  id uuid primary key,
  sender_id uuid not null references auth.users(id) on delete restrict,
  recipient_id uuid not null references auth.users(id) on delete restrict,
  target_type text not null,
  target_id uuid not null,
  amount integer not null check (amount in (300, 500, 1000)),
  currency text not null default 'jpy' check (currency = 'jpy'),
  platform_fee_amount integer not null check (platform_fee_amount >= 0),
  recipient_amount integer not null check (recipient_amount >= 0),
  stripe_destination_account_id text not null,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  status text not null default 'pending',
  optional_message text,
  refunded_at timestamptz,
  refunded_amount integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint content_treats_target_type_check check (target_type in ('snap', 'article', 'backroom_thread', 'backroom_comment')),
  constraint content_treats_status_check check (status in ('pending', 'completed', 'expired', 'failed', 'partially_refunded', 'refunded')),
  constraint content_treats_not_self_check check (sender_id <> recipient_id),
  constraint content_treats_message_check check (optional_message is null or char_length(optional_message) <= 200),
  constraint content_treats_amount_check check (platform_fee_amount < amount and recipient_amount = amount - platform_fee_amount and refunded_amount between 0 and amount)
);

create index if not exists content_treats_sender_created_idx on public.content_treats(sender_id, created_at desc);
create index if not exists content_treats_recipient_created_idx on public.content_treats(recipient_id, created_at desc);
create index if not exists content_treats_target_idx on public.content_treats(target_type, target_id);
create unique index if not exists content_treats_pending_one_per_sender_target_amount_idx
  on public.content_treats(sender_id, target_type, target_id, amount)
  where status = 'pending';

alter table public.content_treats enable row level security;
revoke all on public.content_treats from anon, authenticated;
grant select on public.content_treats to authenticated;
drop policy if exists "content_treats_select_participant" on public.content_treats;
create policy "content_treats_select_participant"
  on public.content_treats for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());

create table if not exists public.stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  processing_status text not null default 'processing',
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint stripe_webhook_events_status_check check (processing_status in ('processing', 'completed', 'failed'))
);

alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from anon, authenticated;

create table if not exists public.backroom_comment_likes (
  comment_id uuid not null references public.backroom_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (comment_id, user_id)
);

create index if not exists backroom_comment_likes_comment_idx on public.backroom_comment_likes(comment_id);
alter table public.backroom_comment_likes enable row level security;
revoke all on public.backroom_comment_likes from anon, authenticated;
grant select, insert, delete on public.backroom_comment_likes to authenticated;
drop policy if exists "backroom_comment_likes_select_own" on public.backroom_comment_likes;
create policy "backroom_comment_likes_select_own"
  on public.backroom_comment_likes for select to authenticated using (user_id = auth.uid());
drop policy if exists "backroom_comment_likes_insert_own" on public.backroom_comment_likes;
create policy "backroom_comment_likes_insert_own"
  on public.backroom_comment_likes for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.backroom_comments
      join public.backroom_posts on backroom_posts.id = backroom_comments.post_id
      join public.backroom_profiles on backroom_profiles.user_id = auth.uid()
      where backroom_comments.id = backroom_comment_likes.comment_id
        and backroom_comments.user_id <> auth.uid()
        and backroom_comments.is_deleted = false
        and backroom_posts.is_deleted = false
    )
  );
drop policy if exists "backroom_comment_likes_delete_own" on public.backroom_comment_likes;
create policy "backroom_comment_likes_delete_own"
  on public.backroom_comment_likes for delete to authenticated using (user_id = auth.uid());

create or replace function public.get_public_backroom_comment_like_counts(p_comment_ids uuid[])
returns table(comment_id uuid, like_count bigint)
language sql stable security definer set search_path = public
as $$
  select likes.comment_id, count(*)::bigint
  from public.backroom_comment_likes as likes
  join public.backroom_comments as comments on comments.id = likes.comment_id
  join public.backroom_posts as posts on posts.id = comments.post_id
  where likes.comment_id = any(coalesce(p_comment_ids, '{}'::uuid[]))
    and comments.is_deleted = false
    and posts.is_deleted = false
  group by likes.comment_id;
$$;
revoke all on function public.get_public_backroom_comment_like_counts(uuid[]) from public, anon;
grant execute on function public.get_public_backroom_comment_like_counts(uuid[]) to authenticated;

alter table public.notifications add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.notifications drop constraint if exists notifications_notification_type_check;
alter table public.notifications add constraint notifications_notification_type_check check (notification_type in (
  'snap_thanks', 'snap_like', 'snap_comment', 'snap_comment_like',
  'article_thanks', 'article_like', 'article_comment', 'follow',
  'snap_treat_received', 'article_treat_received', 'back_room_thread_treat_received',
  'back_room_comment_treat_received', 'paid_article_purchased', 'back_room_comment_liked'
));
alter table public.notifications drop constraint if exists notifications_target_type_check;
alter table public.notifications add constraint notifications_target_type_check check (target_type in (
  'snap', 'snap_comment', 'article', 'article_comment', 'profile',
  'treat', 'paid_article_purchase', 'backroom_comment'
));

create or replace function public.claim_stripe_webhook_event(p_stripe_event_id text, p_event_type text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare claimed boolean := false;
declare affected_count integer := 0;
begin
  insert into public.stripe_webhook_events(stripe_event_id, event_type, processing_status)
  values (p_stripe_event_id, p_event_type, 'processing')
  on conflict (stripe_event_id) do update
    set processing_status = 'processing', last_error = null, updated_at = timezone('utc', now())
    where public.stripe_webhook_events.processing_status = 'failed';
  get diagnostics affected_count = row_count;
  claimed := affected_count > 0;
  return claimed;
end;
$$;

create or replace function public.finish_stripe_webhook_event(p_stripe_event_id text, p_success boolean, p_error text default null)
returns void
language sql security definer set search_path = public
as $$
  update public.stripe_webhook_events
  set processing_status = case when p_success then 'completed' else 'failed' end,
      processed_at = case when p_success then timezone('utc', now()) else null end,
      last_error = case when p_success then null else left(coalesce(p_error, 'processing failed'), 500) end,
      updated_at = timezone('utc', now())
  where stripe_event_id = p_stripe_event_id;
$$;

create or replace function public.complete_content_treat(
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_completed_at timestamptz
)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare item public.content_treats%rowtype;
declare notification_kind text;
begin
  update public.content_treats
  set status = 'completed', stripe_payment_intent_id = p_payment_intent_id,
      completed_at = coalesce(p_completed_at, timezone('utc', now())), updated_at = timezone('utc', now())
  where stripe_checkout_session_id = p_checkout_session_id and status = 'pending'
  returning * into item;

  if not found then return false; end if;
  notification_kind := case item.target_type
    when 'snap' then 'snap_treat_received'
    when 'article' then 'article_treat_received'
    when 'backroom_thread' then 'back_room_thread_treat_received'
    else 'back_room_comment_treat_received'
  end;

  insert into public.notifications(recipient_id, actor_id, notification_type, target_type, target_id, destination_id, snap_id, article_id, metadata)
  values (
    item.recipient_id, item.sender_id, notification_kind, 'treat', item.id::text, item.target_id::text,
    case when item.target_type = 'snap' then item.target_id else null end,
    case when item.target_type = 'article' then item.target_id::text else null end,
    jsonb_build_object('amount', item.amount, 'message', item.optional_message)
  ) on conflict (recipient_id, actor_id, notification_type, target_type, target_id) do nothing;
  return true;
end;
$$;

create or replace function public.complete_paid_article_purchase(
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_completed_at timestamptz
)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare item public.paid_article_purchases%rowtype;
begin
  update public.paid_article_purchases
  set status = 'completed', stripe_payment_intent_id = p_payment_intent_id,
      purchased_at = coalesce(p_completed_at, timezone('utc', now())), updated_at = timezone('utc', now())
  where stripe_checkout_session_id = p_checkout_session_id and status = 'pending'
  returning * into item;
  if not found then return false; end if;

  insert into public.notifications(recipient_id, actor_id, notification_type, target_type, target_id, destination_id, article_id, metadata)
  values (
    item.seller_id, item.buyer_id, 'paid_article_purchased', 'paid_article_purchase', item.id::text,
    item.article_id::text, item.article_id::text, jsonb_build_object('amount', item.price_amount)
  ) on conflict (recipient_id, actor_id, notification_type, target_type, target_id) do nothing;
  return true;
end;
$$;

create or replace function public.notify_backroom_comment_like()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare comment_owner uuid;
declare parent_post uuid;
begin
  select comments.user_id, comments.post_id into comment_owner, parent_post
  from public.backroom_comments as comments where comments.id = new.comment_id;
  if comment_owner is null or comment_owner = new.user_id then return new; end if;
  perform public.create_notification_once(
    comment_owner, new.user_id, 'back_room_comment_liked', 'backroom_comment', new.comment_id::text,
    parent_post::text, null, null, null, null
  );
  return new;
end;
$$;

create or replace function public.cleanup_backroom_comment_like_notification()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  delete from public.notifications
  where actor_id = old.user_id and notification_type = 'back_room_comment_liked'
    and target_type = 'backroom_comment' and target_id = old.comment_id::text;
  return old;
end;
$$;

drop trigger if exists notify_backroom_comment_like_insert on public.backroom_comment_likes;
create trigger notify_backroom_comment_like_insert after insert on public.backroom_comment_likes
  for each row execute function public.notify_backroom_comment_like();
drop trigger if exists cleanup_backroom_comment_like_delete on public.backroom_comment_likes;
create trigger cleanup_backroom_comment_like_delete after delete on public.backroom_comment_likes
  for each row execute function public.cleanup_backroom_comment_like_notification();

create or replace function public.notification_target_is_visible(p_notification public.notifications)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
begin
  if auth.uid() is distinct from p_notification.recipient_id then return false; end if;
  case p_notification.notification_type
    when 'snap_thanks', 'snap_like', 'snap_comment', 'snap_comment_like', 'snap_treat_received' then
      return p_notification.snap_id is not null and exists (
        select 1 from public.snaps where snaps.id = p_notification.snap_id and snaps.is_published = true and snaps.is_deleted = false
      );
    when 'article_thanks', 'article_like', 'article_comment', 'article_treat_received', 'paid_article_purchased' then
      return p_notification.article_id is not null and exists (
        select 1 from public.articles where articles.id::text = p_notification.article_id and articles.is_published = true and articles.is_deleted = false
      );
    when 'back_room_thread_treat_received' then
      return exists (select 1 from public.backroom_posts where id::text = p_notification.destination_id and is_deleted = false);
    when 'back_room_comment_treat_received', 'back_room_comment_liked' then
      return exists (
        select 1 from public.backroom_comments join public.backroom_posts on backroom_posts.id = backroom_comments.post_id
        where backroom_comments.id::text = p_notification.destination_id and backroom_comments.is_deleted = false and backroom_posts.is_deleted = false
      );
    when 'follow' then
      return p_notification.target_type = 'profile' and p_notification.target_id = p_notification.actor_id::text
        and exists (select 1 from public.profiles where profiles.id = p_notification.actor_id);
    else return false;
  end case;
end;
$$;

drop function if exists public.list_my_notifications(integer);
create function public.list_my_notifications(p_limit integer default 30)
returns table(
  id uuid, recipient_id uuid, actor_id uuid, notification_type text, target_type text, target_id text, destination_id text,
  snap_id uuid, article_id uuid, snap_comment_id uuid, article_comment_id uuid, metadata jsonb,
  created_at timestamptz, read_at timestamptz, actor_display_name text, actor_avatar_url text
)
language sql stable security definer set search_path = public
as $$
  select notifications.id, notifications.recipient_id, notifications.actor_id, notifications.notification_type,
    notifications.target_type, notifications.target_id, notifications.destination_id, notifications.snap_id,
    notifications.article_id, notifications.snap_comment_id, notifications.article_comment_id, notifications.metadata,
    notifications.created_at, notifications.read_at, profiles.display_name, profiles.avatar_url
  from public.notifications
  left join public.profiles on profiles.id = notifications.actor_id
  where notifications.recipient_id = auth.uid() and public.notification_target_is_visible(notifications)
  order by notifications.created_at desc
  limit greatest(1, least(coalesce(p_limit, 30), 100));
$$;

revoke all on function public.claim_stripe_webhook_event(text, text) from public, anon, authenticated;
revoke all on function public.finish_stripe_webhook_event(text, boolean, text) from public, anon, authenticated;
revoke all on function public.complete_content_treat(text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.complete_paid_article_purchase(text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.claim_stripe_webhook_event(text, text) to service_role;
grant execute on function public.finish_stripe_webhook_event(text, boolean, text) to service_role;
grant execute on function public.complete_content_treat(text, text, timestamptz) to service_role;
grant execute on function public.complete_paid_article_purchase(text, text, timestamptz) to service_role;
revoke all on function public.notify_backroom_comment_like() from public;
revoke all on function public.cleanup_backroom_comment_like_notification() from public;
revoke all on function public.list_my_notifications(integer) from public, anon;
grant execute on function public.list_my_notifications(integer) to authenticated;
