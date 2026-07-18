create or replace function public.list_public_news(news_limit integer default 4)
returns table (
  id uuid,
  draft_title text,
  draft_summary text,
  draft_body text,
  morning_tip text,
  conversation_tip text,
  category text,
  source_name text,
  source_url text,
  reviewed_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    nd.id,
    nd.draft_title,
    nd.draft_summary,
    nd.draft_body,
    nd.morning_tip,
    nd.conversation_tip,
    nd.category,
    nd.source_name,
    nd.source_url,
    nd.reviewed_at
  from public.news_drafts as nd
  where public.is_publishable_news_draft(nd)
  order by
    nd.reviewed_at desc,
    nd.updated_at desc,
    nd.created_at desc,
    nd.id desc
  limit least(greatest(coalesce(news_limit, 4), 1), 20)
$$;

revoke all on function public.list_public_news(integer) from public;

grant execute on function public.list_public_news(integer) to anon, authenticated;

comment on function public.list_public_news(integer) is
  'Read-only public 3MIN NEWS RPC. Returns approved, complete news fields only, ordered by BARBER HUB publication time reviewed_at desc, then updated_at desc, created_at desc, id desc. Top selection does not use risk_level or WORK/STYLE/TALK balance.';
