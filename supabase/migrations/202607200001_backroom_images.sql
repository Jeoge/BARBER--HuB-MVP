-- Back Room thread and comment images.
-- The bucket stays private; the application signs URLs on the server only.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'backroom-images',
  'backroom-images',
  false,
  2097152,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.backroom_comments
  alter column body drop not null;

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conname
    from pg_constraint
    where conrelid = 'public.backroom_comments'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%btrim(body)%'
  loop
    execute format('alter table public.backroom_comments drop constraint if exists %I', constraint_record.conname);
  end loop;
end $$;

alter table public.backroom_comments
  add constraint backroom_comments_body_length_check
  check (body is null or char_length(btrim(body)) between 1 and 1000) not valid;

create table if not exists public.backroom_thread_images (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.backroom_posts(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  width integer,
  height integer,
  byte_size integer not null,
  mime_type text not null,
  created_at timestamptz not null default now(),
  constraint backroom_thread_images_storage_path_check
    check (storage_path ~* '^threads/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'),
  constraint backroom_thread_images_sort_order_check
    check (sort_order >= 0),
  constraint backroom_thread_images_dimensions_check
    check ((width is null or width > 0) and (height is null or height > 0)),
  constraint backroom_thread_images_byte_size_check
    check (byte_size > 0 and byte_size <= 2097152),
  constraint backroom_thread_images_mime_type_check
    check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  constraint backroom_thread_images_one_per_order
    unique (thread_id, sort_order),
  constraint backroom_thread_images_storage_path_unique
    unique (storage_path)
);

create index if not exists backroom_thread_images_thread_order_idx
  on public.backroom_thread_images(thread_id, sort_order);

create table if not exists public.backroom_comment_images (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.backroom_comments(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  width integer,
  height integer,
  byte_size integer not null,
  mime_type text not null,
  created_at timestamptz not null default now(),
  constraint backroom_comment_images_storage_path_check
    check (storage_path ~* '^comments/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'),
  constraint backroom_comment_images_sort_order_check
    check (sort_order >= 0),
  constraint backroom_comment_images_dimensions_check
    check ((width is null or width > 0) and (height is null or height > 0)),
  constraint backroom_comment_images_byte_size_check
    check (byte_size > 0 and byte_size <= 2097152),
  constraint backroom_comment_images_mime_type_check
    check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  constraint backroom_comment_images_one_per_order
    unique (comment_id, sort_order),
  constraint backroom_comment_images_storage_path_unique
    unique (storage_path)
);

create index if not exists backroom_comment_images_comment_order_idx
  on public.backroom_comment_images(comment_id, sort_order);

alter table public.backroom_thread_images enable row level security;
alter table public.backroom_comment_images enable row level security;

drop policy if exists "backroom_thread_images_select_members" on public.backroom_thread_images;
create policy "backroom_thread_images_select_members"
  on public.backroom_thread_images
  for select
  to authenticated
  using (
    public.has_backroom_profile(auth.uid())
    and exists (
      select 1
      from public.backroom_posts
      where backroom_posts.id = backroom_thread_images.thread_id
        and (backroom_posts.is_deleted = false or backroom_posts.user_id = auth.uid())
    )
  );

drop policy if exists "backroom_thread_images_insert_own" on public.backroom_thread_images;
create policy "backroom_thread_images_insert_own"
  on public.backroom_thread_images
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and public.has_backroom_profile(auth.uid())
    and storage_path like 'threads/' || thread_id::text || '/%'
    and exists (
      select 1
      from public.backroom_posts
      where backroom_posts.id = backroom_thread_images.thread_id
        and backroom_posts.user_id = auth.uid()
        and backroom_posts.is_deleted = false
    )
  );

drop policy if exists "backroom_thread_images_update_own" on public.backroom_thread_images;
create policy "backroom_thread_images_update_own"
  on public.backroom_thread_images
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.backroom_posts
      where backroom_posts.id = backroom_thread_images.thread_id
        and backroom_posts.user_id = auth.uid()
        and public.has_backroom_profile(auth.uid())
    )
  )
  with check (
    auth.uid() is not null
    and storage_path like 'threads/' || thread_id::text || '/%'
    and exists (
      select 1
      from public.backroom_posts
      where backroom_posts.id = backroom_thread_images.thread_id
        and backroom_posts.user_id = auth.uid()
        and backroom_posts.is_deleted = false
    )
  );

drop policy if exists "backroom_thread_images_delete_own" on public.backroom_thread_images;
create policy "backroom_thread_images_delete_own"
  on public.backroom_thread_images
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.backroom_posts
      where backroom_posts.id = backroom_thread_images.thread_id
        and backroom_posts.user_id = auth.uid()
        and public.has_backroom_profile(auth.uid())
    )
  );

drop policy if exists "backroom_comment_images_select_members" on public.backroom_comment_images;
create policy "backroom_comment_images_select_members"
  on public.backroom_comment_images
  for select
  to authenticated
  using (
    public.has_backroom_profile(auth.uid())
    and exists (
      select 1
      from public.backroom_comments
      inner join public.backroom_posts on backroom_posts.id = backroom_comments.post_id
      where backroom_comments.id = backroom_comment_images.comment_id
        and (backroom_comments.is_deleted = false or backroom_comments.user_id = auth.uid())
        and backroom_posts.is_deleted = false
    )
  );

drop policy if exists "backroom_comment_images_insert_own" on public.backroom_comment_images;
create policy "backroom_comment_images_insert_own"
  on public.backroom_comment_images
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and public.has_backroom_profile(auth.uid())
    and storage_path like 'comments/' || comment_id::text || '/%'
    and exists (
      select 1
      from public.backroom_comments
      inner join public.backroom_posts on backroom_posts.id = backroom_comments.post_id
      where backroom_comments.id = backroom_comment_images.comment_id
        and backroom_comments.user_id = auth.uid()
        and backroom_comments.is_deleted = false
        and backroom_posts.is_deleted = false
    )
  );

drop policy if exists "backroom_comment_images_update_own" on public.backroom_comment_images;
create policy "backroom_comment_images_update_own"
  on public.backroom_comment_images
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.backroom_comments
      inner join public.backroom_posts on backroom_posts.id = backroom_comments.post_id
      where backroom_comments.id = backroom_comment_images.comment_id
        and backroom_comments.user_id = auth.uid()
        and public.has_backroom_profile(auth.uid())
    )
  )
  with check (
    auth.uid() is not null
    and storage_path like 'comments/' || comment_id::text || '/%'
    and exists (
      select 1
      from public.backroom_comments
      inner join public.backroom_posts on backroom_posts.id = backroom_comments.post_id
      where backroom_comments.id = backroom_comment_images.comment_id
        and backroom_comments.user_id = auth.uid()
        and backroom_comments.is_deleted = false
        and backroom_posts.is_deleted = false
    )
  );

drop policy if exists "backroom_comment_images_delete_own" on public.backroom_comment_images;
create policy "backroom_comment_images_delete_own"
  on public.backroom_comment_images
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.backroom_comments
      where backroom_comments.id = backroom_comment_images.comment_id
        and backroom_comments.user_id = auth.uid()
        and public.has_backroom_profile(auth.uid())
    )
  );

-- This bucket is private. There is intentionally no SELECT policy on storage.objects.
-- DELETE policies support failed-upload compensation only; this migration adds no Back Room deletion UI or Server Action.
drop policy if exists "backroom_images_insert_own_thread" on storage.objects;
create policy "backroom_images_insert_own_thread"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'backroom-images'
    and name like 'threads/%'
    and name ~* '^threads/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
    and exists (
      select 1
      from public.backroom_posts
      where ('threads/' || backroom_posts.id::text || '/') = left(name, length('threads/' || backroom_posts.id::text || '/'))
        and backroom_posts.user_id = auth.uid()
        and backroom_posts.is_deleted = false
        and public.has_backroom_profile(auth.uid())
    )
  );

drop policy if exists "backroom_images_update_own_thread" on storage.objects;
create policy "backroom_images_update_own_thread"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'backroom-images'
    and name like 'threads/%'
    and name ~* '^threads/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
    and exists (
      select 1
      from public.backroom_posts
      where ('threads/' || backroom_posts.id::text || '/') = left(name, length('threads/' || backroom_posts.id::text || '/'))
        and backroom_posts.user_id = auth.uid()
        and public.has_backroom_profile(auth.uid())
    )
  )
  with check (
    bucket_id = 'backroom-images'
    and name like 'threads/%'
    and name ~* '^threads/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
    and exists (
      select 1
      from public.backroom_posts
      where ('threads/' || backroom_posts.id::text || '/') = left(name, length('threads/' || backroom_posts.id::text || '/'))
        and backroom_posts.user_id = auth.uid()
        and backroom_posts.is_deleted = false
        and public.has_backroom_profile(auth.uid())
    )
  );

drop policy if exists "backroom_images_delete_own_thread" on storage.objects;
create policy "backroom_images_delete_own_thread"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'backroom-images'
    and name like 'threads/%'
    and exists (
      select 1
      from public.backroom_posts
      where ('threads/' || backroom_posts.id::text || '/') = left(name, length('threads/' || backroom_posts.id::text || '/'))
        and backroom_posts.user_id = auth.uid()
        and public.has_backroom_profile(auth.uid())
    )
  );

drop policy if exists "backroom_images_insert_own_comment" on storage.objects;
create policy "backroom_images_insert_own_comment"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'backroom-images'
    and name like 'comments/%'
    and name ~* '^comments/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
    and exists (
      select 1
      from public.backroom_comments
      inner join public.backroom_posts on backroom_posts.id = backroom_comments.post_id
      where ('comments/' || backroom_comments.id::text || '/') = left(name, length('comments/' || backroom_comments.id::text || '/'))
        and backroom_comments.user_id = auth.uid()
        and backroom_comments.is_deleted = false
        and backroom_posts.is_deleted = false
        and public.has_backroom_profile(auth.uid())
    )
  );

drop policy if exists "backroom_images_update_own_comment" on storage.objects;
create policy "backroom_images_update_own_comment"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'backroom-images'
    and name like 'comments/%'
    and name ~* '^comments/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
    and exists (
      select 1
      from public.backroom_comments
      where ('comments/' || backroom_comments.id::text || '/') = left(name, length('comments/' || backroom_comments.id::text || '/'))
        and backroom_comments.user_id = auth.uid()
        and public.has_backroom_profile(auth.uid())
    )
  )
  with check (
    bucket_id = 'backroom-images'
    and name like 'comments/%'
    and name ~* '^comments/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
    and exists (
      select 1
      from public.backroom_comments
      inner join public.backroom_posts on backroom_posts.id = backroom_comments.post_id
      where ('comments/' || backroom_comments.id::text || '/') = left(name, length('comments/' || backroom_comments.id::text || '/'))
        and backroom_comments.user_id = auth.uid()
        and backroom_comments.is_deleted = false
        and backroom_posts.is_deleted = false
        and public.has_backroom_profile(auth.uid())
    )
  );

drop policy if exists "backroom_images_delete_own_comment" on storage.objects;
create policy "backroom_images_delete_own_comment"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'backroom-images'
    and name like 'comments/%'
    and exists (
      select 1
      from public.backroom_comments
      where ('comments/' || backroom_comments.id::text || '/') = left(name, length('comments/' || backroom_comments.id::text || '/'))
        and backroom_comments.user_id = auth.uid()
        and public.has_backroom_profile(auth.uid())
    )
  );
