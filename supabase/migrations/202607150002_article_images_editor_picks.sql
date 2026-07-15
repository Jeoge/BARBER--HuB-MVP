alter table if exists public.articles
  add column if not exists editor_pick_at timestamptz;

create index if not exists articles_editor_pick_published_idx
  on public.articles(editor_pick_at desc, published_at desc, created_at desc)
  where editor_pick_at is not null
    and is_published = true
    and is_deleted = false;

create or replace function public.article_editor_pick_unchanged(
  article_id uuid,
  new_editor_pick_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select articles.editor_pick_at is not distinct from new_editor_pick_at
      from public.articles
      where articles.id = article_id
      limit 1
    ),
    new_editor_pick_at is null
  )
$$;

revoke all on function public.article_editor_pick_unchanged(uuid, timestamptz) from public;
grant execute on function public.article_editor_pick_unchanged(uuid, timestamptz) to authenticated;

do $$
begin
  if to_regclass('public.articles') is not null then
    alter table public.articles enable row level security;

    drop policy if exists "articles_insert_own" on public.articles;
    create policy "articles_insert_own"
      on public.articles
      for insert
      to authenticated
      with check (
        auth.uid() = author_id
        and editor_pick_at is null
      );

    drop policy if exists "articles_update_own" on public.articles;
    create policy "articles_update_own"
      on public.articles
      for update
      to authenticated
      using (auth.uid() = author_id)
      with check (
        auth.uid() = author_id
        and public.article_editor_pick_unchanged(id, editor_pick_at)
      );
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

do $$
begin
  drop policy if exists "article_images_select_public_article_or_own" on storage.objects;
  drop policy if exists "article_images_select_own_folder" on storage.objects;

  create policy "article_images_select_own_folder"
    on storage.objects
    for select
    to authenticated
    using (
      bucket_id = 'article-images'
      and auth.uid() is not null
      and (storage.foldername(name))[1] = auth.uid()::text
    );

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'article_images_insert_own_folder'
  ) then
    create policy "article_images_insert_own_folder"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'article-images'
        and auth.uid() is not null
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'article_images_update_own_folder'
  ) then
    create policy "article_images_update_own_folder"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'article-images'
        and auth.uid() is not null
        and (storage.foldername(name))[1] = auth.uid()::text
      )
      with check (
        bucket_id = 'article-images'
        and auth.uid() is not null
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'article_images_delete_own_folder'
  ) then
    create policy "article_images_delete_own_folder"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'article-images'
        and auth.uid() is not null
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;
