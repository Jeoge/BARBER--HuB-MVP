create table if not exists public.advertising_inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_name text not null,
  contact_name text not null,
  email text not null,
  account_type text,
  inquiry_type text not null,
  content_summary text not null,
  purpose text,
  desired_timing text,
  budget_range text,
  website_url text,
  note text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.advertising_inquiries
  drop constraint if exists advertising_inquiries_status_check;

alter table public.advertising_inquiries
  add constraint advertising_inquiries_status_check
  check (status in ('new', 'reviewing', 'contacted', 'closed')) not valid;

create index if not exists advertising_inquiries_user_created_idx
  on public.advertising_inquiries(user_id, created_at desc);

create index if not exists advertising_inquiries_status_created_idx
  on public.advertising_inquiries(status, created_at desc);

alter table public.advertising_inquiries enable row level security;

drop policy if exists "advertising_inquiries_insert_own" on public.advertising_inquiries;
create policy "advertising_inquiries_insert_own"
  on public.advertising_inquiries
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "advertising_inquiries_select_own" on public.advertising_inquiries;
create policy "advertising_inquiries_select_own"
  on public.advertising_inquiries
  for select
  to authenticated
  using (auth.uid() = user_id);
