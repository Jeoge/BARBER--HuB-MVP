create table if not exists public.news_drafts (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_url text not null,
  source_title text not null,
  source_published_at timestamptz,
  fetched_at timestamptz not null default now(),
  source_excerpt text,
  source_type text not null default 'rss',
  category text not null default 'ニュース',
  relevance_score integer not null default 0 check (relevance_score >= 0 and relevance_score <= 100),
  relevance_reason text,
  draft_title text,
  draft_summary text,
  draft_body text,
  morning_tip text,
  conversation_tip text,
  fact_check_notes text,
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  generation_error text,
  duplicate_key text,
  duplicate_of uuid references public.news_drafts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

create unique index if not exists news_drafts_source_url_unique_idx
  on public.news_drafts(source_url);

create index if not exists news_drafts_status_created_idx
  on public.news_drafts(status, created_at desc);

create index if not exists news_drafts_duplicate_key_idx
  on public.news_drafts(duplicate_key)
  where duplicate_key is not null;

create index if not exists news_drafts_source_published_idx
  on public.news_drafts(source_published_at desc);

create or replace function public.set_news_drafts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_news_drafts_updated_at on public.news_drafts;
create trigger set_news_drafts_updated_at
  before update on public.news_drafts
  for each row
  execute function public.set_news_drafts_updated_at();

alter table public.news_drafts enable row level security;

revoke all on table public.news_drafts from anon, authenticated;
grant all on table public.news_drafts to service_role;

comment on table public.news_drafts is
  'Non-public 3MIN NEWS draft queue. Public users have no RLS policies; server-only service role access is required.';
