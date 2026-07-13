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
    news_drafts.id,
    news_drafts.draft_title,
    news_drafts.draft_summary,
    news_drafts.draft_body,
    news_drafts.morning_tip,
    news_drafts.conversation_tip,
    news_drafts.category,
    news_drafts.source_name,
    news_drafts.source_url,
    news_drafts.reviewed_at
  from public.news_drafts
  where news_drafts.status = 'approved'
    and news_drafts.generation_error is null
    and news_drafts.duplicate_of is null
    and length(btrim(coalesce(news_drafts.draft_title, ''))) > 0
    and length(btrim(coalesce(news_drafts.draft_summary, ''))) > 0
    and length(btrim(coalesce(news_drafts.draft_body, ''))) > 0
    and length(btrim(coalesce(news_drafts.morning_tip, ''))) > 0
    and length(btrim(coalesce(news_drafts.conversation_tip, ''))) > 0
    and length(btrim(coalesce(news_drafts.category, ''))) > 0
    and length(btrim(coalesce(news_drafts.source_name, ''))) > 0
    and length(btrim(coalesce(news_drafts.source_url, ''))) > 0
    and btrim(news_drafts.source_url) ~* '^https?://'
  order by news_drafts.reviewed_at desc nulls last, news_drafts.updated_at desc, news_drafts.created_at desc
  limit least(greatest(coalesce(news_limit, 4), 1), 20)
$$;

create or replace function public.get_public_news_by_id(news_id uuid)
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
    news_drafts.id,
    news_drafts.draft_title,
    news_drafts.draft_summary,
    news_drafts.draft_body,
    news_drafts.morning_tip,
    news_drafts.conversation_tip,
    news_drafts.category,
    news_drafts.source_name,
    news_drafts.source_url,
    news_drafts.reviewed_at
  from public.news_drafts
  where news_drafts.id = news_id
    and news_drafts.status = 'approved'
    and news_drafts.generation_error is null
    and news_drafts.duplicate_of is null
    and length(btrim(coalesce(news_drafts.draft_title, ''))) > 0
    and length(btrim(coalesce(news_drafts.draft_summary, ''))) > 0
    and length(btrim(coalesce(news_drafts.draft_body, ''))) > 0
    and length(btrim(coalesce(news_drafts.morning_tip, ''))) > 0
    and length(btrim(coalesce(news_drafts.conversation_tip, ''))) > 0
    and length(btrim(coalesce(news_drafts.category, ''))) > 0
    and length(btrim(coalesce(news_drafts.source_name, ''))) > 0
    and length(btrim(coalesce(news_drafts.source_url, ''))) > 0
    and btrim(news_drafts.source_url) ~* '^https?://'
  limit 1
$$;

revoke all on function public.list_public_news(integer) from public;
revoke all on function public.get_public_news_by_id(uuid) from public;

grant execute on function public.list_public_news(integer) to anon, authenticated;
grant execute on function public.get_public_news_by_id(uuid) to anon, authenticated;

comment on function public.list_public_news(integer) is
  'Read-only public 3MIN NEWS RPC. Returns approved, complete news fields only.';

comment on function public.get_public_news_by_id(uuid) is
  'Read-only public 3MIN NEWS detail RPC. Returns one approved, complete news item only.';
