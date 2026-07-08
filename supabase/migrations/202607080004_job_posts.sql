create table if not exists public.job_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  salon_name text not null,
  employer_name text,
  address text,
  prefecture text,
  city text,
  station text,
  image_url text,
  job_title text not null,
  employment_type text,
  description text,
  pr_message text,
  salary text,
  working_hours text,
  holidays text,
  benefits text,
  trial_period text,
  application_method text,
  tags text[] not null default '{}',
  contact_phone text,
  contact_email text,
  website_url text,
  instagram_url text,
  line_url text,
  application_url text,
  visit_available boolean not null default true,
  status text not null default 'published',
  is_paid_featured boolean not null default false,
  is_deleted boolean not null default false,
  featured_until timestamptz,
  sort_priority int not null default 0,
  plan_type text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_posts
  drop constraint if exists job_posts_status_check;

alter table public.job_posts
  add constraint job_posts_status_check
  check (status in ('draft', 'published', 'closed')) not valid;

alter table public.job_posts
  drop constraint if exists job_posts_plan_type_check;

alter table public.job_posts
  add constraint job_posts_plan_type_check
  check (plan_type in ('free', 'featured', 'boost')) not valid;

create index if not exists job_posts_public_created_idx
  on public.job_posts(created_at desc)
  where status = 'published' and is_deleted = false;

create index if not exists job_posts_public_area_idx
  on public.job_posts(prefecture, city, created_at desc)
  where status = 'published' and is_deleted = false;

create index if not exists job_posts_user_created_idx
  on public.job_posts(user_id, created_at desc)
  where is_deleted = false;

create or replace function public.can_manage_job_posts(profile_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = profile_user_id
      and (
        nullif(btrim(coalesce(salon_name, '')), '') is not null
        or nullif(btrim(coalesce(shop_address, '')), '') is not null
        or lower(coalesce(job_type, '')) like any (array['%shop%', '%salon%', '%business%', '%barber%', '%owner%'])
        or coalesce(job_type, '') like '%' || U&'\30B5\30ED\30F3' || '%'
        or coalesce(job_type, '') like '%' || U&'\5E97\8217' || '%'
        or coalesce(job_type, '') like '%' || U&'\7406\5BB9\5BA4' || '%'
        or coalesce(job_type, '') like '%' || U&'\7F8E\5BB9\5BA4' || '%'
      )
  )
$$;

create or replace function public.set_job_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_job_posts_updated_at on public.job_posts;
create trigger set_job_posts_updated_at
  before update on public.job_posts
  for each row
  execute function public.set_job_posts_updated_at();

alter table public.job_posts enable row level security;

drop policy if exists "job_posts_select_public_or_own" on public.job_posts;
create policy "job_posts_select_public_or_own"
  on public.job_posts
  for select
  to anon, authenticated
  using (
    (status = 'published' and is_deleted = false)
    or auth.uid() = user_id
  );

drop policy if exists "job_posts_insert_own_salon" on public.job_posts;
create policy "job_posts_insert_own_salon"
  on public.job_posts
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.can_manage_job_posts(auth.uid())
    and is_deleted = false
  );

drop policy if exists "job_posts_update_own_salon" on public.job_posts;
create policy "job_posts_update_own_salon"
  on public.job_posts
  for update
  to authenticated
  using (
    auth.uid() = user_id
    and public.can_manage_job_posts(auth.uid())
  )
  with check (
    auth.uid() = user_id
    and public.can_manage_job_posts(auth.uid())
  );

drop policy if exists "job_posts_delete_own_salon" on public.job_posts;
create policy "job_posts_delete_own_salon"
  on public.job_posts
  for delete
  to authenticated
  using (
    auth.uid() = user_id
    and public.can_manage_job_posts(auth.uid())
  );
