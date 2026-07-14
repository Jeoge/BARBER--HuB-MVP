alter table public.news_drafts
  add column if not exists title_candidates jsonb,
  add column if not exists primary_angle text;

alter table public.news_drafts
  drop constraint if exists news_drafts_title_candidates_object_check;

alter table public.news_drafts
  add constraint news_drafts_title_candidates_object_check
  check (title_candidates is null or jsonb_typeof(title_candidates) = 'object');

alter table public.news_drafts
  drop constraint if exists news_drafts_primary_angle_check;

alter table public.news_drafts
  add constraint news_drafts_primary_angle_check
  check (primary_angle is null or primary_angle in ('work', 'personal', 'conversation'));

comment on column public.news_drafts.title_candidates is
  'Internal editor-only 3MIN NEWS title candidates by angle: work, personal, conversation.';

comment on column public.news_drafts.primary_angle is
  'Internal editor-only AI recommended title candidate angle: work, personal, or conversation.';
