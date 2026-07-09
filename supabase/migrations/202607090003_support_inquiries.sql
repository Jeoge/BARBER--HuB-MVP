create table if not exists public.support_inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  inquiry_type text not null,
  target_url text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists support_inquiries_user_created_idx
  on public.support_inquiries(user_id, created_at desc);

create index if not exists support_inquiries_type_created_idx
  on public.support_inquiries(inquiry_type, created_at desc);

alter table public.support_inquiries enable row level security;

drop policy if exists "support_inquiries_insert_public" on public.support_inquiries;
create policy "support_inquiries_insert_public"
  on public.support_inquiries
  for insert
  to anon, authenticated
  with check (
    (
      auth.uid() is null
      and user_id is null
    )
    or user_id = auth.uid()
  );

drop policy if exists "support_inquiries_select_own" on public.support_inquiries;
create policy "support_inquiries_select_own"
  on public.support_inquiries
  for select
  to authenticated
  using (user_id = auth.uid());
