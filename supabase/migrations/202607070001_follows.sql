-- follows: あるユーザー(follower_id)が別のユーザー(following_id)をフォローする関係。
-- 本テーブルは既にSupabase上で作成済み。このマイグレーションは再現・ドキュメント用で、
-- 何度実行しても安全（idempotent）になるようにしている。

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

create index if not exists follows_following_id_idx on public.follows (following_id);

alter table public.follows enable row level security;

do $$
begin
  -- select は全員可（フォロワー数などを誰でも表示できるように）
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'follows'
      and policyname = 'follows_select_all'
  ) then
    create policy "follows_select_all"
      on public.follows
      for select
      to anon, authenticated
      using (true);
  end if;

  -- insert は本人のみ・自分自身へのフォローは不可
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'follows'
      and policyname = 'follows_insert_own'
  ) then
    create policy "follows_insert_own"
      on public.follows
      for insert
      to authenticated
      with check (auth.uid() = follower_id and follower_id <> following_id);
  end if;

  -- delete は本人のみ
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'follows'
      and policyname = 'follows_delete_own'
  ) then
    create policy "follows_delete_own"
      on public.follows
      for delete
      to authenticated
      using (auth.uid() = follower_id);
  end if;
end $$;
