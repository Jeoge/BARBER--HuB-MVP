alter table public.profiles
  add column if not exists shop_address text,
  add column if not exists shop_map_url text,
  add column if not exists website_url text,
  add column if not exists instagram_url text,
  add column if not exists youtube_url text,
  add column if not exists tiktok_url text,
  add column if not exists x_url text,
  add column if not exists line_url text,
  add column if not exists hotpepper_url text,
  add column if not exists rakuten_url text,
  add column if not exists booking_url text;

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  category text,
  image_url text,
  image_path text,
  is_published boolean not null default true,
  is_deleted boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_author_created_idx
  on public.articles(author_id, created_at desc);

create index if not exists articles_published_created_idx
  on public.articles(created_at desc)
  where is_published = true and is_deleted = false;

alter table public.articles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'articles'
      and policyname = 'articles_select_published_or_own'
  ) then
    create policy "articles_select_published_or_own"
      on public.articles
      for select
      to anon, authenticated
      using (
        (is_published = true and is_deleted = false)
        or auth.uid() = author_id
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'articles'
      and policyname = 'articles_insert_own'
  ) then
    create policy "articles_insert_own"
      on public.articles
      for insert
      to authenticated
      with check (auth.uid() = author_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'articles'
      and policyname = 'articles_update_own'
  ) then
    create policy "articles_update_own"
      on public.articles
      for update
      to authenticated
      using (auth.uid() = author_id)
      with check (auth.uid() = author_id);
  end if;
end $$;

create table if not exists public.article_reactions (
  id uuid primary key default gen_random_uuid(),
  article_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'thanks', 'save')),
  created_at timestamptz not null default now()
);

create unique index if not exists article_reactions_one_per_user_idx
  on public.article_reactions(article_id, user_id, reaction_type);

create index if not exists article_reactions_article_idx
  on public.article_reactions(article_id, reaction_type);

create or replace function public.article_author_id(article_id_text text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select author_id
  from public.articles
  where id::text = article_id_text
    and is_deleted = false
  limit 1
$$;

alter table public.article_reactions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'article_reactions'
      and policyname = 'article_reactions_select_all'
  ) then
    create policy "article_reactions_select_all"
      on public.article_reactions
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'article_reactions'
      and policyname = 'article_reactions_insert_own_not_author'
  ) then
    create policy "article_reactions_insert_own_not_author"
      on public.article_reactions
      for insert
      to authenticated
      with check (
        auth.uid() = user_id
        and (
          public.article_author_id(article_id) is null
          or public.article_author_id(article_id) <> auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'article_reactions'
      and policyname = 'article_reactions_delete_own'
  ) then
    create policy "article_reactions_delete_own"
      on public.article_reactions
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

create table if not exists public.article_comments (
  id uuid primary key default gen_random_uuid(),
  article_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists article_comments_article_created_idx
  on public.article_comments(article_id, created_at desc)
  where is_deleted = false;

alter table public.article_comments enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'article_comments'
      and policyname = 'article_comments_select_visible'
  ) then
    create policy "article_comments_select_visible"
      on public.article_comments
      for select
      to anon, authenticated
      using (is_deleted = false);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'article_comments'
      and policyname = 'article_comments_insert_own'
  ) then
    create policy "article_comments_insert_own"
      on public.article_comments
      for insert
      to authenticated
      with check (
        auth.uid() = user_id
        and length(btrim(body)) > 0
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'article_comments'
      and policyname = 'article_comments_update_own'
  ) then
    create policy "article_comments_update_own"
      on public.article_comments
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
