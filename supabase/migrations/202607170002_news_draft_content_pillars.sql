alter table public.news_drafts
  add column if not exists content_pillar text not null default 'work',
  add column if not exists topic_category text,
  add column if not exists relevance_direction text,
  add column if not exists conversation_value text;

alter table public.news_drafts
  drop constraint if exists news_drafts_content_pillar_check;

alter table public.news_drafts
  add constraint news_drafts_content_pillar_check
  check (content_pillar in ('work', 'style', 'talk'));

alter table public.news_drafts
  drop constraint if exists news_drafts_relevance_direction_check;

alter table public.news_drafts
  add constraint news_drafts_relevance_direction_check
  check (relevance_direction is null or relevance_direction in ('direct', 'proposal', 'conversation'));

create index if not exists news_drafts_status_pillar_reviewed_idx
  on public.news_drafts(status, content_pillar, reviewed_at desc);

comment on column public.news_drafts.content_pillar is
  'Internal editor-only 3MIN NEWS pillar: work, style, or talk. Not returned by public RPCs.';

comment on column public.news_drafts.topic_category is
  'Internal editor-only detailed 3MIN NEWS topic such as mens_fashion, mens_hair, music_bgm, entertainment, or sports.';

comment on column public.news_drafts.relevance_direction is
  'Internal editor-only relevance direction: direct, proposal, or conversation.';

comment on column public.news_drafts.conversation_value is
  'Internal editor-only note explaining how the item can be used for customer conversation, proposal, or store experience.';

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
  with approved_news as (
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
      news_drafts.reviewed_at,
      news_drafts.updated_at,
      news_drafts.created_at,
      news_drafts.risk_level,
      news_drafts.content_pillar,
      row_number() over (
        partition by news_drafts.content_pillar
        order by
          case when news_drafts.risk_level = 'high' then 0 else 1 end,
          news_drafts.reviewed_at desc nulls last,
          news_drafts.updated_at desc,
          news_drafts.created_at desc
      ) as pillar_rank
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
  ),
  balanced_news as (
    select *
    from approved_news
    where
      (content_pillar = 'work' and (pillar_rank <= 2 or (risk_level = 'high' and pillar_rank <= 3)))
      or (content_pillar = 'style' and pillar_rank <= 2)
      or (content_pillar = 'talk' and pillar_rank <= 1)
  )
  select
    balanced_news.id,
    balanced_news.draft_title,
    balanced_news.draft_summary,
    balanced_news.draft_body,
    balanced_news.morning_tip,
    balanced_news.conversation_tip,
    balanced_news.category,
    balanced_news.source_name,
    balanced_news.source_url,
    balanced_news.reviewed_at
  from balanced_news
  order by
    case when balanced_news.risk_level = 'high' then 0 else 1 end,
    balanced_news.reviewed_at desc nulls last,
    balanced_news.updated_at desc,
    balanced_news.created_at desc
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
  'Read-only public 3MIN NEWS RPC. Returns approved, complete news fields only, balanced across internal WORK/STYLE/TALK pillars.';

comment on function public.get_public_news_by_id(uuid) is
  'Read-only public 3MIN NEWS detail RPC. Returns one approved, complete news item only.';
