-- Snap multiple compressed images.
-- Existing snaps.image_url / snaps.image_path stay as the fallback first image.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'snap-images',
  'snap-images',
  true,
  4194304,
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

create table if not exists public.snap_images (
  id uuid primary key default gen_random_uuid(),
  snap_id uuid not null references public.snaps(id) on delete cascade,
  storage_path text not null unique,
  public_url text not null,
  display_order smallint not null,
  width integer,
  height integer,
  byte_size integer not null,
  mime_type text not null,
  created_at timestamptz not null default now(),
  constraint snap_images_display_order_range check (display_order between 0 and 3),
  constraint snap_images_one_per_order unique (snap_id, display_order),
  constraint snap_images_positive_width check (width is null or width > 0),
  constraint snap_images_positive_height check (height is null or height > 0),
  constraint snap_images_byte_size_range check (byte_size > 0 and byte_size <= 4194304),
  constraint snap_images_mime_type_allowed check (mime_type in ('image/jpeg', 'image/webp'))
);

create index if not exists snap_images_snap_order_idx
  on public.snap_images (snap_id, display_order);

alter table public.snap_images enable row level security;

drop policy if exists "snap_images_select_public_or_own" on public.snap_images;
create policy "snap_images_select_public_or_own"
  on public.snap_images
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.snaps
      where snaps.id = snap_images.snap_id
        and (
          (snaps.is_published = true and snaps.is_deleted = false)
          or snaps.author_id = auth.uid()
        )
    )
  );

drop policy if exists "snap_images_insert_own_snap" on public.snap_images;
create policy "snap_images_insert_own_snap"
  on public.snap_images
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and storage_path like auth.uid()::text || '/%'
    and exists (
      select 1
      from public.snaps
      where snaps.id = snap_images.snap_id
        and snaps.author_id = auth.uid()
        and snaps.is_deleted = false
    )
  );

drop policy if exists "snap_images_update_own_snap" on public.snap_images;
create policy "snap_images_update_own_snap"
  on public.snap_images
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.snaps
      where snaps.id = snap_images.snap_id
        and snaps.author_id = auth.uid()
    )
  )
  with check (
    auth.uid() is not null
    and storage_path like auth.uid()::text || '/%'
    and exists (
      select 1
      from public.snaps
      where snaps.id = snap_images.snap_id
        and snaps.author_id = auth.uid()
        and snaps.is_deleted = false
    )
  );

drop policy if exists "snap_images_delete_own_snap" on public.snap_images;
create policy "snap_images_delete_own_snap"
  on public.snap_images
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.snaps
      where snaps.id = snap_images.snap_id
        and snaps.author_id = auth.uid()
    )
  );

drop policy if exists "snap_images_select_public" on storage.objects;
drop policy if exists "snap_images_select_public_snap_or_own" on storage.objects;
create policy "snap_images_select_public_snap_or_own"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'snap-images'
    and (
      exists (
        select 1
        from public.snaps
        where snaps.image_path = storage.objects.name
          and snaps.is_published = true
          and snaps.is_deleted = false
      )
      or exists (
        select 1
        from public.snap_images
        inner join public.snaps on snaps.id = snap_images.snap_id
        where snap_images.storage_path = storage.objects.name
          and snaps.is_published = true
          and snaps.is_deleted = false
      )
      or (
        auth.uid() is not null
        and (storage.foldername(name))[1] = auth.uid()::text
      )
    )
  );
