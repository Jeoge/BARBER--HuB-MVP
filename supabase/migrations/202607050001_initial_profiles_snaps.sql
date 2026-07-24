-- Baseline for preview branches created from a project whose original core
-- schema predates the checked-in migration history. This is schema-only and
-- mirrors the existing Production definitions for profiles and snaps.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  job_type text,
  salon_name text,
  region text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  shop_address text,
  shop_map_url text,
  website_url text,
  instagram_url text,
  youtube_url text,
  tiktok_url text,
  x_url text,
  line_url text,
  hotpepper_url text,
  rakuten_url text,
  booking_url text,
  cover_url text
);

create table if not exists public.snaps (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  caption text not null,
  category text not null default '日常',
  region text,
  image_url text,
  image_path text,
  is_published boolean not null default true,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  safety_confirmed_at timestamptz,
  guidelines_confirmed boolean not null default false,
  pr_disclosure_checked boolean not null default false
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_snaps_updated_at on public.snaps;
create trigger set_snaps_updated_at
  before update on public.snaps
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select to anon, authenticated
  using (true);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

alter table public.snaps enable row level security;
drop policy if exists "snaps_select_published_or_own" on public.snaps;
create policy "snaps_select_published_or_own"
  on public.snaps for select to anon, authenticated
  using ((is_published = true and is_deleted = false) or auth.uid() = author_id);
drop policy if exists "snaps_insert_own" on public.snaps;
create policy "snaps_insert_own"
  on public.snaps for insert to authenticated
  with check (auth.uid() = author_id);
drop policy if exists "snaps_update_own" on public.snaps;
create policy "snaps_update_own"
  on public.snaps for update to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);
drop policy if exists "snaps_delete_own" on public.snaps;
create policy "snaps_delete_own"
  on public.snaps for delete to authenticated
  using (auth.uid() = author_id);
