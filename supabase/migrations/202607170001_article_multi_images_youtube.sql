alter table if exists public.articles
  add column if not exists youtube_url text;

do $$
begin
  if to_regclass('public.articles') is not null
    and not exists (
      select 1
      from pg_constraint
      where conname = 'articles_youtube_url_length_check'
        and conrelid = to_regclass('public.articles')
    )
  then
    alter table public.articles
      add constraint articles_youtube_url_length_check
      check (youtube_url is null or length(youtube_url) <= 300);
  end if;
end $$;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'article-images',
  'article-images',
  false,
  2097152,
  array[
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.article_images (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  storage_path text not null,
  display_order integer not null,
  width integer,
  height integer,
  byte_size integer,
  mime_type text,
  created_at timestamptz not null default now(),
  constraint article_images_storage_path_not_empty_check check (length(btrim(storage_path)) > 0),
  constraint article_images_display_order_check check (display_order >= 0 and display_order < 4),
  constraint article_images_dimensions_check check (
    (width is null or width > 0)
    and (height is null or height > 0)
  ),
  constraint article_images_byte_size_check check (byte_size is null or (byte_size > 0 and byte_size <= 2097152)),
  constraint article_images_mime_type_check check (mime_type is null or mime_type in ('image/jpeg', 'image/webp'))
);

create unique index if not exists article_images_article_order_idx
  on public.article_images(article_id, display_order);

create unique index if not exists article_images_article_path_idx
  on public.article_images(article_id, storage_path);

create index if not exists article_images_article_display_idx
  on public.article_images(article_id, display_order);

alter table public.article_images enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'article_images'
      and policyname = 'article_images_select_visible_article'
  ) then
    create policy "article_images_select_visible_article"
      on public.article_images
      for select
      to anon, authenticated
      using (
        exists (
          select 1
          from public.articles
          where articles.id = article_images.article_id
            and (
              (articles.is_published = true and articles.is_deleted = false)
              or auth.uid() = articles.author_id
            )
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'article_images'
      and policyname = 'article_images_insert_own_article'
  ) then
    create policy "article_images_insert_own_article"
      on public.article_images
      for insert
      to authenticated
      with check (
        auth.uid() is not null
        and storage_path like auth.uid()::text || '/' || article_id::text || '/%'
        and exists (
          select 1
          from public.articles
          where articles.id = article_images.article_id
            and articles.author_id = auth.uid()
            and articles.is_deleted = false
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'article_images'
      and policyname = 'article_images_update_own_article'
  ) then
    create policy "article_images_update_own_article"
      on public.article_images
      for update
      to authenticated
      using (
        exists (
          select 1
          from public.articles
          where articles.id = article_images.article_id
            and articles.author_id = auth.uid()
            and articles.is_deleted = false
        )
      )
      with check (
        auth.uid() is not null
        and storage_path like auth.uid()::text || '/' || article_id::text || '/%'
        and exists (
          select 1
          from public.articles
          where articles.id = article_images.article_id
            and articles.author_id = auth.uid()
            and articles.is_deleted = false
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'article_images'
      and policyname = 'article_images_delete_own_article'
  ) then
    create policy "article_images_delete_own_article"
      on public.article_images
      for delete
      to authenticated
      using (
        exists (
          select 1
          from public.articles
          where articles.id = article_images.article_id
            and articles.author_id = auth.uid()
        )
      );
  end if;
end $$;
