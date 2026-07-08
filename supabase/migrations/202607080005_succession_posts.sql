create table if not exists public.succession_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_type text not null,
  title text not null,
  public_description text not null,
  prefecture text,
  city text,
  area text,
  business_type text,
  seats_count int,
  shampoo_count int,
  years_open text,
  desired_timing text,
  public_image_url text,
  contact_method text,
  status text not null default 'published',
  is_deleted boolean not null default false,
  is_paid_featured boolean not null default false,
  sort_priority int not null default 0,
  plan_type text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.succession_post_private (
  post_id uuid primary key references public.succession_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  private_shop_name text,
  private_address text,
  private_price text,
  private_rent text,
  private_sales_note text,
  private_owner_contact text,
  private_borrowing_note text,
  private_customer_count_note text,
  private_staff_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.succession_posts
  drop constraint if exists succession_posts_status_check;

alter table public.succession_posts
  add constraint succession_posts_status_check
  check (status in ('draft', 'published', 'closed')) not valid;

alter table public.succession_posts
  drop constraint if exists succession_posts_plan_type_check;

alter table public.succession_posts
  add constraint succession_posts_plan_type_check
  check (plan_type in ('free', 'featured', 'editorial', 'regional')) not valid;

create index if not exists succession_posts_public_created_idx
  on public.succession_posts(created_at desc)
  where status = 'published' and is_deleted = false;

create index if not exists succession_posts_public_area_idx
  on public.succession_posts(prefecture, city, created_at desc)
  where status = 'published' and is_deleted = false;

create index if not exists succession_posts_user_created_idx
  on public.succession_posts(user_id, created_at desc)
  where is_deleted = false;

create index if not exists succession_post_private_user_idx
  on public.succession_post_private(user_id);

create or replace function public.set_succession_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_succession_posts_updated_at on public.succession_posts;
create trigger set_succession_posts_updated_at
  before update on public.succession_posts
  for each row
  execute function public.set_succession_posts_updated_at();

create or replace function public.set_succession_post_private_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_succession_post_private_updated_at on public.succession_post_private;
create trigger set_succession_post_private_updated_at
  before update on public.succession_post_private
  for each row
  execute function public.set_succession_post_private_updated_at();

alter table public.succession_posts enable row level security;
alter table public.succession_post_private enable row level security;

drop policy if exists "succession_posts_select_public_or_own" on public.succession_posts;
create policy "succession_posts_select_public_or_own"
  on public.succession_posts
  for select
  to anon, authenticated
  using (
    (status = 'published' and is_deleted = false)
    or auth.uid() = user_id
  );

drop policy if exists "succession_posts_insert_own" on public.succession_posts;
create policy "succession_posts_insert_own"
  on public.succession_posts
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and is_deleted = false
  );

drop policy if exists "succession_posts_update_own" on public.succession_posts;
create policy "succession_posts_update_own"
  on public.succession_posts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "succession_posts_delete_own" on public.succession_posts;
create policy "succession_posts_delete_own"
  on public.succession_posts
  for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "succession_post_private_select_own" on public.succession_post_private;
create policy "succession_post_private_select_own"
  on public.succession_post_private
  for select
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.succession_posts
      where succession_posts.id = succession_post_private.post_id
        and succession_posts.user_id = auth.uid()
    )
  );

drop policy if exists "succession_post_private_insert_own" on public.succession_post_private;
create policy "succession_post_private_insert_own"
  on public.succession_post_private
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.succession_posts
      where succession_posts.id = succession_post_private.post_id
        and succession_posts.user_id = auth.uid()
    )
  );

drop policy if exists "succession_post_private_update_own" on public.succession_post_private;
create policy "succession_post_private_update_own"
  on public.succession_post_private
  for update
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.succession_posts
      where succession_posts.id = succession_post_private.post_id
        and succession_posts.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.succession_posts
      where succession_posts.id = succession_post_private.post_id
        and succession_posts.user_id = auth.uid()
    )
  );

drop policy if exists "succession_post_private_delete_own" on public.succession_post_private;
create policy "succession_post_private_delete_own"
  on public.succession_post_private
  for delete
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.succession_posts
      where succession_posts.id = succession_post_private.post_id
        and succession_posts.user_id = auth.uid()
    )
  );
