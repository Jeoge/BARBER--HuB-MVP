-- 公開Snapのコメント数だけを返す集計RPC。
-- 個別コメント、user_id、本文、日時は返さない。

create or replace function public.get_public_snap_comment_counts()
returns table (
  snap_id uuid,
  comment_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    snaps.id as snap_id,
    count(snap_comments.id)::bigint as comment_count
  from public.snaps
  left join public.snap_comments
    on snap_comments.snap_id = snaps.id
  where snaps.is_published = true
    and snaps.is_deleted = false
  group by snaps.id;
$$;

revoke all on function public.get_public_snap_comment_counts() from public;
grant execute on function public.get_public_snap_comment_counts() to anon, authenticated;
