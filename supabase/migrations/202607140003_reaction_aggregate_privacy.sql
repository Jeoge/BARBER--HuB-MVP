-- Reaction privacy hardening:
-- - Individual Snap/article reaction rows are visible only to the reacting user.
-- - Authors read aggregate counts through RPCs that never return reactor identities.
-- - Article authors cannot Thanks/like their own article, but may save it.

drop policy if exists "snap_reactions_select_all" on public.snap_reactions;
drop policy if exists "snap_reactions_select_own_or_author" on public.snap_reactions;
drop policy if exists "snap_reactions_select_own" on public.snap_reactions;
create policy "snap_reactions_select_own"
  on public.snap_reactions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "article_reactions_select_all" on public.article_reactions;
drop policy if exists "article_reactions_select_own_or_author" on public.article_reactions;
drop policy if exists "article_reactions_select_own" on public.article_reactions;
create policy "article_reactions_select_own"
  on public.article_reactions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "article_reactions_insert_own_not_author" on public.article_reactions;
create policy "article_reactions_insert_own_not_author"
  on public.article_reactions
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (
      reaction_type = 'save'
      or public.article_author_id(article_id) is null
      or public.article_author_id(article_id) <> auth.uid()
    )
  );

create or replace function public.get_my_snap_reaction_counts()
returns table (
  snap_id uuid,
  thanks_count bigint,
  like_count bigint,
  comment_count bigint,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with my_snaps as (
    select id
    from public.snaps
    where author_id = auth.uid()
      and is_deleted = false
  ),
  reaction_counts as (
    select
      snap_reactions.snap_id,
      count(*) filter (
        where snap_reactions.reaction_type = 'thanks'
          and snap_reactions.user_id <> auth.uid()
      ) as thanks_count,
      count(*) filter (
        where snap_reactions.reaction_type = 'like'
          and snap_reactions.user_id <> auth.uid()
      ) as like_count
    from public.snap_reactions
    inner join my_snaps on my_snaps.id = snap_reactions.snap_id
    group by snap_reactions.snap_id
  ),
  comment_counts as (
    select
      snap_comments.snap_id,
      count(*) filter (where snap_comments.user_id <> auth.uid()) as comment_count
    from public.snap_comments
    inner join my_snaps on my_snaps.id = snap_comments.snap_id
    group by snap_comments.snap_id
  )
  select
    my_snaps.id as snap_id,
    coalesce(reaction_counts.thanks_count, 0)::bigint as thanks_count,
    coalesce(reaction_counts.like_count, 0)::bigint as like_count,
    coalesce(comment_counts.comment_count, 0)::bigint as comment_count,
    (
      coalesce(reaction_counts.thanks_count, 0)
      + coalesce(reaction_counts.like_count, 0)
      + coalesce(comment_counts.comment_count, 0)
    )::bigint as total_count
  from my_snaps
  left join reaction_counts on reaction_counts.snap_id = my_snaps.id
  left join comment_counts on comment_counts.snap_id = my_snaps.id;
$$;

revoke all on function public.get_my_snap_reaction_counts() from public;
revoke all on function public.get_my_snap_reaction_counts() from anon;
grant execute on function public.get_my_snap_reaction_counts() to authenticated;

create or replace function public.get_my_article_reaction_counts()
returns table (
  article_id text,
  thanks_count bigint,
  like_count bigint,
  save_count bigint,
  comment_count bigint,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with my_articles as (
    select id::text as id
    from public.articles
    where author_id = auth.uid()
      and is_deleted = false
  ),
  reaction_counts as (
    select
      article_reactions.article_id,
      count(*) filter (
        where article_reactions.reaction_type = 'thanks'
          and article_reactions.user_id <> auth.uid()
      ) as thanks_count,
      count(*) filter (
        where article_reactions.reaction_type = 'like'
          and article_reactions.user_id <> auth.uid()
      ) as like_count,
      count(*) filter (
        where article_reactions.reaction_type = 'save'
          and article_reactions.user_id <> auth.uid()
      ) as save_count
    from public.article_reactions
    inner join my_articles on my_articles.id = article_reactions.article_id
    group by article_reactions.article_id
  ),
  comment_counts as (
    select
      article_comments.article_id,
      count(*) filter (
        where article_comments.user_id <> auth.uid()
          and article_comments.is_deleted = false
      ) as comment_count
    from public.article_comments
    inner join my_articles on my_articles.id = article_comments.article_id
    group by article_comments.article_id
  )
  select
    my_articles.id as article_id,
    coalesce(reaction_counts.thanks_count, 0)::bigint as thanks_count,
    coalesce(reaction_counts.like_count, 0)::bigint as like_count,
    coalesce(reaction_counts.save_count, 0)::bigint as save_count,
    coalesce(comment_counts.comment_count, 0)::bigint as comment_count,
    (
      coalesce(reaction_counts.thanks_count, 0)
      + coalesce(reaction_counts.like_count, 0)
      + coalesce(reaction_counts.save_count, 0)
      + coalesce(comment_counts.comment_count, 0)
    )::bigint as total_count
  from my_articles
  left join reaction_counts on reaction_counts.article_id = my_articles.id
  left join comment_counts on comment_counts.article_id = my_articles.id;
$$;

revoke all on function public.get_my_article_reaction_counts() from public;
revoke all on function public.get_my_article_reaction_counts() from anon;
grant execute on function public.get_my_article_reaction_counts() to authenticated;
