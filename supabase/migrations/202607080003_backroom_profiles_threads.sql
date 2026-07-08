create table if not exists public.backroom_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists backroom_profiles_user_id_idx
  on public.backroom_profiles(user_id);

alter table public.backroom_profiles
  drop constraint if exists backroom_profiles_nickname_length_check;

alter table public.backroom_profiles
  add constraint backroom_profiles_nickname_length_check
  check (char_length(btrim(nickname)) between 1 and 20) not valid;

alter table public.backroom_profiles enable row level security;

create or replace function public.has_backroom_profile(profile_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.backroom_profiles
    where user_id = profile_user_id
  )
$$;

drop policy if exists "backroom_profiles_select_members" on public.backroom_profiles;
create policy "backroom_profiles_select_members"
  on public.backroom_profiles
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.has_backroom_profile(auth.uid())
  );

drop policy if exists "backroom_profiles_insert_own" on public.backroom_profiles;
create policy "backroom_profiles_insert_own"
  on public.backroom_profiles
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and char_length(btrim(nickname)) between 1 and 20
  );

drop policy if exists "backroom_profiles_update_own" on public.backroom_profiles;
create policy "backroom_profiles_update_own"
  on public.backroom_profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and char_length(btrim(nickname)) between 1 and 20
  );

-- Normalize older Back Room rows before tightening the category policy:
-- other -> zatsudan, complaint -> zatsudan, student -> STU.
update public.backroom_posts
set category = U&'\96D1\8AC7'
where category = U&'\305D\306E\4ED6'
  or category = U&'\611A\75F4';

update public.backroom_posts
set category = 'STU'
where category = U&'\5B66\751F';

alter table public.backroom_posts
  drop constraint if exists backroom_posts_category_check;

alter table public.backroom_posts
  add constraint backroom_posts_category_check
  check (
    category = U&'\55B6\696D\5F8C\30C8\30FC\30AF'
    or category = U&'\76F8\8AC7'
    or category = U&'\7D4C\55B6'
    or category = U&'\72EC\7ACB'
    or category = U&'\30B9\30BF\30C3\30D5'
    or category = U&'\96C6\5BA2'
    or category = U&'\6280\8853'
    or category = U&'\6750\6599'
    or category = 'STU'
    or category = U&'\30A2\30B7\30B9\30BF\30F3\30C8'
    or category = U&'\8DA3\5473'
    or category = U&'\96D1\8AC7'
  ) not valid;

alter table public.backroom_posts enable row level security;

drop policy if exists "backroom_posts_select_authenticated" on public.backroom_posts;
drop policy if exists "backroom_posts_select_members" on public.backroom_posts;
create policy "backroom_posts_select_members"
  on public.backroom_posts
  for select
  to authenticated
  using (
    public.has_backroom_profile(auth.uid())
    and (is_deleted = false or auth.uid() = user_id)
  );

drop policy if exists "backroom_posts_insert_own" on public.backroom_posts;
create policy "backroom_posts_insert_own"
  on public.backroom_posts
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.has_backroom_profile(auth.uid())
    and is_deleted = false
  );

drop policy if exists "backroom_posts_update_own" on public.backroom_posts;
create policy "backroom_posts_update_own"
  on public.backroom_posts
  for update
  to authenticated
  using (
    auth.uid() = user_id
    and public.has_backroom_profile(auth.uid())
  )
  with check (
    auth.uid() = user_id
    and public.has_backroom_profile(auth.uid())
  );

drop policy if exists "backroom_posts_delete_own" on public.backroom_posts;
create policy "backroom_posts_delete_own"
  on public.backroom_posts
  for delete
  to authenticated
  using (
    auth.uid() = user_id
    and public.has_backroom_profile(auth.uid())
  );

alter table public.backroom_comments enable row level security;

drop policy if exists "backroom_comments_select_authenticated" on public.backroom_comments;
drop policy if exists "backroom_comments_select_members" on public.backroom_comments;
create policy "backroom_comments_select_members"
  on public.backroom_comments
  for select
  to authenticated
  using (
    public.has_backroom_profile(auth.uid())
    and is_deleted = false
  );

drop policy if exists "backroom_comments_insert_own" on public.backroom_comments;
create policy "backroom_comments_insert_own"
  on public.backroom_comments
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.has_backroom_profile(auth.uid())
    and is_deleted = false
    and exists (
      select 1
      from public.backroom_posts
      where id = post_id
        and is_deleted = false
    )
  );

drop policy if exists "backroom_comments_update_own" on public.backroom_comments;
create policy "backroom_comments_update_own"
  on public.backroom_comments
  for update
  to authenticated
  using (
    auth.uid() = user_id
    and public.has_backroom_profile(auth.uid())
  )
  with check (
    auth.uid() = user_id
    and public.has_backroom_profile(auth.uid())
  );

drop policy if exists "backroom_comments_delete_own" on public.backroom_comments;
create policy "backroom_comments_delete_own"
  on public.backroom_comments
  for delete
  to authenticated
  using (
    auth.uid() = user_id
    and public.has_backroom_profile(auth.uid())
  );
