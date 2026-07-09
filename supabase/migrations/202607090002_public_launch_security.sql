-- Public launch security hardening for profiles, snaps, snap reactions, and snap images.
-- Apply this in Supabase before public release.

do $$
declare
  policy_record record;
begin
  if to_regclass('public.profiles') is not null then
    alter table public.profiles enable row level security;

    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = 'profiles'
    loop
      execute format('drop policy if exists %I on public.profiles', policy_record.policyname);
    end loop;

    create policy "profiles_select_public"
      on public.profiles
      for select
      to anon, authenticated
      using (true);

    create policy "profiles_insert_own"
      on public.profiles
      for insert
      to authenticated
      with check (auth.uid() = id);

    create policy "profiles_update_own"
      on public.profiles
      for update
      to authenticated
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;

do $$
declare
  policy_record record;
begin
  if to_regclass('public.snaps') is not null then
    alter table public.snaps enable row level security;

    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = 'snaps'
    loop
      execute format('drop policy if exists %I on public.snaps', policy_record.policyname);
    end loop;

    create policy "snaps_select_published_or_own"
      on public.snaps
      for select
      to anon, authenticated
      using (
        (is_published = true and is_deleted = false)
        or auth.uid() = author_id
      );

    create policy "snaps_insert_own"
      on public.snaps
      for insert
      to authenticated
      with check (auth.uid() = author_id);

    create policy "snaps_update_own"
      on public.snaps
      for update
      to authenticated
      using (auth.uid() = author_id)
      with check (auth.uid() = author_id);

    create policy "snaps_delete_own"
      on public.snaps
      for delete
      to authenticated
      using (auth.uid() = author_id);
  end if;
end $$;

do $$
begin
  if to_regclass('public.snap_reactions') is not null then
    alter table public.snap_reactions enable row level security;

    drop policy if exists "snap_reactions_select_all" on public.snap_reactions;
    drop policy if exists "snap_reactions_insert_own_not_author" on public.snap_reactions;
    drop policy if exists "snap_reactions_delete_own" on public.snap_reactions;

    create policy "snap_reactions_select_all"
      on public.snap_reactions
      for select
      to anon, authenticated
      using (true);

    create policy "snap_reactions_insert_own_not_author"
      on public.snap_reactions
      for insert
      to authenticated
      with check (
        auth.uid() = user_id
        and reaction_type = 'thanks'
        and exists (
          select 1
          from public.snaps
          where snaps.id = snap_reactions.snap_id
            and snaps.is_published = true
            and snaps.is_deleted = false
        )
        and not exists (
          select 1
          from public.snaps
          where snaps.id = snap_reactions.snap_id
            and snaps.author_id = auth.uid()
        )
      );

    create policy "snap_reactions_delete_own"
      on public.snap_reactions
      for delete
      to authenticated
      using (auth.uid() = user_id);
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
  'snap-images',
  'snap-images',
  true,
  10485760,
  array[
    'image/avif',
    'image/gif',
    'image/heic',
    'image/heif',
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

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (
        coalesce(qual, '') like '%snap-images%'
        or coalesce(with_check, '') like '%snap-images%'
      )
  loop
    execute format('drop policy if exists %I on storage.objects', policy_record.policyname);
  end loop;

  drop policy if exists "snap_images_select_public" on storage.objects;
  drop policy if exists "snap_images_insert_own_folder" on storage.objects;
  drop policy if exists "snap_images_update_own_folder" on storage.objects;
  drop policy if exists "snap_images_delete_own_folder" on storage.objects;

  create policy "snap_images_select_public"
    on storage.objects
    for select
    to anon, authenticated
    using (bucket_id = 'snap-images');

  create policy "snap_images_insert_own_folder"
    on storage.objects
    for insert
    to authenticated
    with check (
      bucket_id = 'snap-images'
      and auth.uid() is not null
      and (storage.foldername(name))[1] = auth.uid()::text
    );

  create policy "snap_images_update_own_folder"
    on storage.objects
    for update
    to authenticated
    using (
      bucket_id = 'snap-images'
      and auth.uid() is not null
      and (storage.foldername(name))[1] = auth.uid()::text
    )
    with check (
      bucket_id = 'snap-images'
      and auth.uid() is not null
      and (storage.foldername(name))[1] = auth.uid()::text
    );

  create policy "snap_images_delete_own_folder"
    on storage.objects
    for delete
    to authenticated
    using (
      bucket_id = 'snap-images'
      and auth.uid() is not null
      and (storage.foldername(name))[1] = auth.uid()::text
    );
end $$;
