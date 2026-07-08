-- snap_reactions restore/repair migration.
-- Some environments have Snap data but missed the original snap_reactions migration.
-- This keeps the Thanks feature aligned with lib/supabase/snaps.ts.

create table if not exists public.snap_reactions (
  id uuid primary key default gen_random_uuid(),
  snap_id uuid not null references public.snaps(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('thanks')),
  created_at timestamptz not null default now(),
  constraint snap_reactions_one_per_user unique (snap_id, user_id, reaction_type)
);

create index if not exists snap_reactions_snap_id_idx
  on public.snap_reactions (snap_id, reaction_type);

create index if not exists snap_reactions_user_id_idx
  on public.snap_reactions (user_id);

alter table public.snap_reactions enable row level security;

drop policy if exists "snap_reactions_select_all" on public.snap_reactions;
create policy "snap_reactions_select_all"
  on public.snap_reactions
  for select
  to anon, authenticated
  using (true);

drop policy if exists "snap_reactions_insert_own_not_author" on public.snap_reactions;
create policy "snap_reactions_insert_own_not_author"
  on public.snap_reactions
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and reaction_type = 'thanks'
    and exists (
      select 1
      from public.snaps
      where snaps.id = snap_reactions.snap_id
        and snaps.is_published = true
        and snaps.is_deleted = false
    )
    and not exists (
      select 1
      from public.snaps
      where snaps.id = snap_reactions.snap_id
        and snaps.author_id = auth.uid()
    )
  );

drop policy if exists "snap_reactions_delete_own" on public.snap_reactions;
create policy "snap_reactions_delete_own"
  on public.snap_reactions
  for delete
  to authenticated
  using (auth.uid() = user_id);
