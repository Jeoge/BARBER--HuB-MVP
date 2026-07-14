-- Snap/article public reactions:
-- - Snap supports both Thanks and like.
-- - Individual reaction rows are visible only to the reacting user or the post author.
-- - Comments/saves cannot be created for deleted or unpublished Snaps.

alter table public.snap_reactions
  drop constraint if exists snap_reactions_reaction_type_check;

alter table public.snap_reactions
  add constraint snap_reactions_reaction_type_check
  check (reaction_type in ('thanks', 'like'));

drop policy if exists "snap_reactions_select_all" on public.snap_reactions;
drop policy if exists "snap_reactions_select_own_or_author" on public.snap_reactions;
create policy "snap_reactions_select_own_or_author"
  on public.snap_reactions
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.snaps
      where snaps.id = snap_reactions.snap_id
        and snaps.author_id = auth.uid()
    )
  );

drop policy if exists "snap_reactions_insert_own_not_author" on public.snap_reactions;
create policy "snap_reactions_insert_own_not_author"
  on public.snap_reactions
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and reaction_type in ('thanks', 'like')
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

drop policy if exists "article_reactions_select_all" on public.article_reactions;
drop policy if exists "article_reactions_select_own_or_author" on public.article_reactions;
create policy "article_reactions_select_own_or_author"
  on public.article_reactions
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.article_author_id(article_id) = auth.uid()
  );

drop policy if exists "snap_comments_select_all" on public.snap_comments;
drop policy if exists "snap_comments_select_public_snap" on public.snap_comments;
create policy "snap_comments_select_public_snap"
  on public.snap_comments
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.snaps
      where snaps.id = snap_comments.snap_id
        and snaps.is_published = true
        and snaps.is_deleted = false
    )
  );

drop policy if exists "snap_comments_insert_own" on public.snap_comments;
create policy "snap_comments_insert_own"
  on public.snap_comments
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and length(btrim(body)) between 1 and 1000
    and exists (
      select 1
      from public.snaps
      where snaps.id = snap_comments.snap_id
        and snaps.is_published = true
        and snaps.is_deleted = false
    )
  );

drop policy if exists "saved_snaps_insert_own" on public.saved_snaps;
create policy "saved_snaps_insert_own"
  on public.saved_snaps
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.snaps
      where snaps.id = saved_snaps.snap_id
        and snaps.is_published = true
        and snaps.is_deleted = false
    )
  );
