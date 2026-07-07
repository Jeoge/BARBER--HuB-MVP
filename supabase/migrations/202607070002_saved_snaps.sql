-- saved_snaps: ユーザーがSnapを「保存」した関係（本人だけが見えるブックマーク）。
-- 何度実行しても安全（idempotent）。

create table if not exists public.saved_snaps (
  user_id uuid not null references public.profiles(id) on delete cascade,
  snap_id uuid not null references public.snaps(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, snap_id)
);

create index if not exists saved_snaps_user_id_idx on public.saved_snaps (user_id);

alter table public.saved_snaps enable row level security;

do $$
begin
  -- SELECT：本人のみ（保存は非公開）
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'saved_snaps'
      and policyname = 'saved_snaps_select_own'
  ) then
    create policy "saved_snaps_select_own"
      on public.saved_snaps
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  -- INSERT：本人のみ
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'saved_snaps'
      and policyname = 'saved_snaps_insert_own'
  ) then
    create policy "saved_snaps_insert_own"
      on public.saved_snaps
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  -- DELETE：本人のみ
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'saved_snaps'
      and policyname = 'saved_snaps_delete_own'
  ) then
    create policy "saved_snaps_delete_own"
      on public.saved_snaps
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;
