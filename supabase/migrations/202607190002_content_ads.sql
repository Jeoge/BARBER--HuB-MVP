create table if not exists public.content_ads (
  id uuid primary key default gen_random_uuid(),
  advertiser_name text not null,
  title text not null,
  short_text text not null,
  image_path text,
  image_url text,
  destination_url text not null,
  cta_label text not null,
  disclosure_label text not null default 'PR',
  placement text not null,
  target_menu text not null default 'all',
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default false,
  priority integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_ads_required_text_check check (
    char_length(btrim(advertiser_name)) > 0
    and char_length(btrim(title)) > 0
    and char_length(btrim(short_text)) > 0
    and char_length(btrim(destination_url)) > 0
    and char_length(btrim(cta_label)) > 0
  ),
  constraint content_ads_destination_url_check check (destination_url ~* '^https?://'),
  constraint content_ads_disclosure_label_check check (disclosure_label in ('PR', '広告', 'Sponsored')),
  constraint content_ads_placement_check check (
    placement in (
      'home',
      'category_management',
      'category_marketing',
      'category_ai',
      'category_technique',
      'category_tools',
      'article_bottom',
      'backroom'
    )
  ),
  constraint content_ads_target_menu_check check (
    target_menu in ('all', 'management', 'marketing', 'ai', 'technique', 'tools')
  ),
  constraint content_ads_schedule_check check (
    starts_at is null
    or ends_at is null
    or starts_at <= ends_at
  )
);

create index if not exists content_ads_active_lookup_idx
  on public.content_ads(placement, target_menu, is_active, priority desc, created_at desc);

create index if not exists content_ads_schedule_idx
  on public.content_ads(starts_at, ends_at)
  where is_active = true;

create or replace function public.set_content_ads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_content_ads_updated_at on public.content_ads;
create trigger set_content_ads_updated_at
  before update on public.content_ads
  for each row
  execute function public.set_content_ads_updated_at();

alter table public.content_ads enable row level security;

revoke all on table public.content_ads from anon, authenticated;
grant select on table public.content_ads to anon, authenticated;
grant all on table public.content_ads to service_role;

drop policy if exists "content_ads_public_select_active" on public.content_ads;
create policy "content_ads_public_select_active"
  on public.content_ads
  for select
  to anon, authenticated
  using (
    is_active = true
    and char_length(btrim(advertiser_name)) > 0
    and char_length(btrim(title)) > 0
    and char_length(btrim(short_text)) > 0
    and char_length(btrim(destination_url)) > 0
    and char_length(btrim(cta_label)) > 0
    and destination_url ~* '^https?://'
    and disclosure_label in ('PR', '広告', 'Sponsored')
    and placement in (
      'home',
      'category_management',
      'category_marketing',
      'category_ai',
      'category_technique',
      'category_tools',
      'article_bottom',
      'backroom'
    )
    and target_menu in ('all', 'management', 'marketing', 'ai', 'technique', 'tools')
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

comment on table public.content_ads is
  'Launch-ready content ad slots. Public users can only read active, scheduled, complete ads; writes are server/admin only via service_role.';
