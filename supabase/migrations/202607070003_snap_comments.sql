-- snap_comments: Snapへのコメント。誰でも閲覧でき、投稿・削除は本人のみ。
-- 何度実行しても安全（idempotent）。

create table if not exists public.snap_comments (
  id uuid primary key default gen_random_uuid(),
  snap_id uuid not null references public.snaps(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists snap_comments_snap_id_idx on public.snap_comments (snap_id, created_at);

alter table public.snap_comments enable row level security;

do $$
begin
  -- SELECT：公開Snapのコメントなので誰でも閲覧可
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'snap_comments'
      and policyname = 'snap_comments_select_all'
  ) then
    create policy "snap_comments_select_all"
      on public.snap_comments
      for select
      to anon, authenticated
      using (true);
  end if;

  -- INSERT：本人のみ
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'snap_comments'
      and policyname = 'snap_comments_insert_own'
  ) then
    create policy "snap_comments_insert_own"
      on public.snap_comments
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  -- DELETE：本人のみ
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'snap_comments'
      and policyname = 'snap_comments_delete_own'
  ) then
    create policy "snap_comments_delete_own"
      on public.snap_comments
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;
