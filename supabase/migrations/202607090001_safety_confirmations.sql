alter table if exists public.snaps
  add column if not exists safety_confirmed_at timestamptz,
  add column if not exists guidelines_confirmed boolean not null default false,
  add column if not exists pr_disclosure_checked boolean not null default false;

alter table if exists public.articles
  add column if not exists safety_confirmed_at timestamptz,
  add column if not exists guidelines_confirmed boolean not null default false,
  add column if not exists pr_disclosure_checked boolean not null default false;

alter table if exists public.backroom_posts
  add column if not exists safety_confirmed_at timestamptz,
  add column if not exists guidelines_confirmed boolean not null default false,
  add column if not exists pr_disclosure_checked boolean not null default false;

alter table if exists public.job_posts
  add column if not exists safety_confirmed_at timestamptz,
  add column if not exists guidelines_confirmed boolean not null default false,
  add column if not exists pr_disclosure_checked boolean not null default false;

alter table if exists public.succession_posts
  add column if not exists safety_confirmed_at timestamptz,
  add column if not exists guidelines_confirmed boolean not null default false,
  add column if not exists pr_disclosure_checked boolean not null default false;

alter table if exists public.advertising_inquiries
  add column if not exists safety_confirmed_at timestamptz,
  add column if not exists guidelines_confirmed boolean not null default false,
  add column if not exists pr_disclosure_checked boolean not null default false;
