alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists cover_url text;

create table if not exists public.snap_reactions (
  id uuid primary key default gen_random_uuid(),
  snap_id uuid not null references public.snaps(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('thanks')),
  created_at timestamptz not null default now(),
  constraint snap_reactions_one_per_user unique (snap_id, user_id, reaction_type)
);

alter table public.snap_reactions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'snap_reactions'
      and policyname = 'snap_reactions_select_all'
  ) then
    create policy "snap_reactions_select_all"
      on public.snap_reactions
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'snap_reactions'
      and policyname = 'snap_reactions_insert_own_not_author'
  ) then
    create policy "snap_reactions_insert_own_not_author"
      on public.snap_reactions
      for insert
      to authenticated
      with check (
        auth.uid() = user_id
        and reaction_type = 'thanks'
        and not exists (
          select 1
          from public.snaps
          where snaps.id = snap_reactions.snap_id
            and snaps.author_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'snap_reactions'
      and policyname = 'snap_reactions_delete_own'
  ) then
    create policy "snap_reactions_delete_own"
      on public.snap_reactions
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do update set public = excluded.public;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'profile_images_select_public'
  ) then
    create policy "profile_images_select_public"
      on storage.objects
      for select
      to anon, authenticated
      using (bucket_id = 'profile-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'profile_images_insert_own_folder'
  ) then
    create policy "profile_images_insert_own_folder"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'profile-images'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'profile_images_update_own_folder'
  ) then
    create policy "profile_images_update_own_folder"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'profile-images'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
      with check (
        bucket_id = 'profile-images'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'profile_images_delete_own_folder'
  ) then
    create policy "profile_images_delete_own_folder"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'profile-images'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;
