create or replace function public.is_publishable_news_draft(draft_row public.news_drafts)
returns boolean
language sql
stable
set search_path = public
as $$
  select (draft_row).status = 'approved'
    and (draft_row).reviewed_at is not null
    and (draft_row).generation_error is null
    and (draft_row).duplicate_of is null
    and (draft_row).content_pillar in ('work', 'style', 'talk')
    and length(btrim(coalesce((draft_row).draft_title, ''))) > 0
    and length(btrim(coalesce((draft_row).draft_summary, ''))) > 0
    and length(btrim(coalesce((draft_row).draft_body, ''))) > 0
    and length(btrim(coalesce((draft_row).morning_tip, ''))) > 0
    and length(btrim(coalesce((draft_row).conversation_tip, ''))) > 0
    and length(btrim(coalesce((draft_row).category, ''))) > 0
    and length(btrim(coalesce((draft_row).source_name, ''))) > 0
    and length(btrim(coalesce((draft_row).source_url, ''))) > 0
    and btrim((draft_row).source_url) ~* '^https?://'
$$;

revoke all on function public.is_publishable_news_draft(public.news_drafts) from public;

comment on function public.is_publishable_news_draft(public.news_drafts) is
  'Internal shared 3MIN NEWS publication gate used by public news RPCs. Keeps approved status, reviewed_at, completeness, duplicate, generation error, source URL, and WORK/STYLE/TALK checks aligned.';

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
  with publishable_news as (
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
      nd.reviewed_at,
      nd.updated_at,
      nd.created_at,
      nd.content_pillar,
      row_number() over (
        partition by nd.content_pillar
        order by nd.reviewed_at desc, nd.updated_at desc, nd.created_at desc
      ) as pillar_rank,
      row_number() over (
        order by nd.reviewed_at desc, nd.updated_at desc, nd.created_at desc
      ) as freshness_rank
    from public.news_drafts as nd
    where public.is_publishable_news_draft(nd)
  ),
  latest_news as (
    select *
    from publishable_news
    where freshness_rank = 1
  ),
  balanced_news as (
    select *
    from publishable_news
    where
      (content_pillar = 'work' and pillar_rank <= 2)
      or (content_pillar = 'style' and pillar_rank <= 2)
      or (content_pillar = 'talk' and pillar_rank <= 1)
  ),
  selected_news as (
    select * from latest_news
    union
    select * from balanced_news
  )
  select
    selected_news.id,
    selected_news.draft_title,
    selected_news.draft_summary,
    selected_news.draft_body,
    selected_news.morning_tip,
    selected_news.conversation_tip,
    selected_news.category,
    selected_news.source_name,
    selected_news.source_url,
    selected_news.reviewed_at
  from selected_news
  order by selected_news.reviewed_at desc, selected_news.updated_at desc, selected_news.created_at desc
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
  where nd.id = news_id
    and public.is_publishable_news_draft(nd)
  limit 1
$$;

revoke all on function public.list_public_news(integer) from public;
revoke all on function public.get_public_news_by_id(uuid) from public;

grant execute on function public.list_public_news(integer) to anon, authenticated;
grant execute on function public.get_public_news_by_id(uuid) to anon, authenticated;

comment on function public.list_public_news(integer) is
  'Read-only public 3MIN NEWS RPC. Returns approved, complete news fields only, keeps the latest publish visible, and fills the rest with WORK/STYLE/TALK-balanced items.';

comment on function public.get_public_news_by_id(uuid) is
  'Read-only public 3MIN NEWS detail RPC. Uses the same publication gate as list_public_news.';
