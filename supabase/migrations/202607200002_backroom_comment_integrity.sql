-- Keep Back Room comments non-empty at the database boundary.
-- Image-only comments are created through the validated RPC below after the
-- server has uploaded the image. No pending comment row is exposed.

alter table public.backroom_comments enable row level security;

drop policy if exists "backroom_comments_insert_own" on public.backroom_comments;
create policy "backroom_comments_insert_own"
  on public.backroom_comments
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.has_backroom_profile(auth.uid())
    and is_deleted = false
    and body is not null
    and char_length(btrim(body)) between 1 and 1000
    and exists (
      select 1
      from public.backroom_posts
      where backroom_posts.id = post_id
        and backroom_posts.is_deleted = false
    )
  );

drop policy if exists "backroom_comments_update_own" on public.backroom_comments;
create policy "backroom_comments_update_own"
  on public.backroom_comments
  for update
  to authenticated
  using (
    auth.uid() = user_id
    and public.has_backroom_profile(auth.uid())
  )
  with check (
    auth.uid() = user_id
    and public.has_backroom_profile(auth.uid())
    and (
      is_deleted = true
      or (
        body is not null
        and char_length(btrim(body)) between 1 and 1000
      )
    )
  );

create or replace function public.enforce_backroom_comment_has_body_or_image()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  comment_id_value uuid;
  comment_body text;
  comment_is_deleted boolean;
begin
  if tg_table_name = 'backroom_comments' then
    comment_id_value := new.id;
  elsif tg_op = 'DELETE' then
    comment_id_value := old.comment_id;
  else
    comment_id_value := new.comment_id;
  end if;

  select body, is_deleted
  into comment_body, comment_is_deleted
  from public.backroom_comments
  where id = comment_id_value;

  if not found or coalesce(comment_is_deleted, false) then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if comment_body is not null and char_length(btrim(comment_body)) between 1 and 1000 then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if exists (
    select 1
    from public.backroom_comment_images
    where comment_id = comment_id_value
  ) then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  raise exception 'backroom_comment_requires_body_or_image'
    using errcode = '23514';
end;
$$;

drop trigger if exists backroom_comments_body_or_image_check on public.backroom_comments;
create constraint trigger backroom_comments_body_or_image_check
  after insert or update on public.backroom_comments
  deferrable initially deferred
  for each row
  execute function public.enforce_backroom_comment_has_body_or_image();

drop trigger if exists backroom_comment_images_body_or_image_check on public.backroom_comment_images;
create constraint trigger backroom_comment_images_body_or_image_check
  after insert or update or delete on public.backroom_comment_images
  deferrable initially deferred
  for each row
  execute function public.enforce_backroom_comment_has_body_or_image();

create or replace function public.create_backroom_image_comment(
  p_comment_id uuid,
  p_post_id uuid,
  p_body text,
  p_storage_path text,
  p_sort_order integer,
  p_width integer,
  p_height integer,
  p_byte_size integer,
  p_mime_type text
)
returns table (id uuid)
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  current_user_id uuid;
  normalized_body text;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'backroom_comment_auth_required';
  end if;

  if not public.has_backroom_profile(current_user_id) then
    raise exception 'backroom_comment_member_required';
  end if;

  if not exists (
    select 1
    from public.backroom_posts
    where backroom_posts.id = p_post_id
      and backroom_posts.is_deleted = false
  ) then
    raise exception 'backroom_post_not_found';
  end if;

  if p_comment_id is null or exists (
    select 1
    from public.backroom_comments
    where backroom_comments.id = p_comment_id
  ) then
    raise exception 'backroom_comment_id_invalid';
  end if;

  normalized_body := nullif(btrim(p_body), '');

  if normalized_body is not null and char_length(normalized_body) > 1000 then
    raise exception 'backroom_comment_body_too_long';
  end if;

  if p_sort_order is distinct from 0
    or p_storage_path is null
    or p_storage_path !~* ('^comments/' || p_comment_id::text || '/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$')
    or left(p_storage_path, length('comments/' || p_comment_id::text || '/')) <> ('comments/' || p_comment_id::text || '/')
  then
    raise exception 'backroom_comment_image_path_invalid';
  end if;

  if p_mime_type not in ('image/jpeg', 'image/png', 'image/webp') then
    raise exception 'backroom_comment_image_mime_invalid';
  end if;

  if p_width is null or p_width <= 0 or p_height is null or p_height <= 0 then
    raise exception 'backroom_comment_image_dimensions_invalid';
  end if;

  if p_byte_size is null or p_byte_size <= 0 or p_byte_size > 2097152 then
    raise exception 'backroom_comment_image_size_invalid';
  end if;

  if not exists (
    select 1
    from storage.objects
    where bucket_id = 'backroom-images'
      and name = p_storage_path
  ) then
    raise exception 'backroom_comment_image_object_missing';
  end if;

  insert into public.backroom_comments (
    id,
    post_id,
    user_id,
    body,
    is_deleted,
    created_at,
    updated_at
  )
  values (
    p_comment_id,
    p_post_id,
    current_user_id,
    normalized_body,
    false,
    now(),
    now()
  );

  insert into public.backroom_comment_images (
    comment_id,
    storage_path,
    sort_order,
    width,
    height,
    byte_size,
    mime_type
  )
  values (
    p_comment_id,
    p_storage_path,
    0,
    p_width,
    p_height,
    p_byte_size,
    p_mime_type
  );

  return query select p_comment_id;
end;
$$;

revoke all on function public.create_backroom_image_comment(uuid, uuid, text, text, integer, integer, integer, integer, text) from public;
grant execute on function public.create_backroom_image_comment(uuid, uuid, text, text, integer, integer, integer, integer, text) to authenticated;
