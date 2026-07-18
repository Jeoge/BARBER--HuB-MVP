update public.barber_shop_import_rows
set
  verification_status = 'unverified',
  validation_errors = case
    when not validation_errors @> array['CSV取込では認証状態を変更できません。公開資料から取り込む店舗は未認証だけ登録できます。']::text[] then
      validation_errors || array['CSV取込では認証状態を変更できません。公開資料から取り込む店舗は未認証だけ登録できます。']::text[]
    else validation_errors
  end
where verification_status <> 'unverified';

alter table public.barber_shop_import_rows
  drop constraint if exists barber_shop_import_rows_verification_status_check;

alter table public.barber_shop_import_rows
  add constraint barber_shop_import_rows_verification_status_check
  check (verification_status = 'unverified');

update public.barber_shops
set verification_status = 'unverified'
where source_type = 'imported'
  and owner_user_id is null
  and verification_status = 'verified';

alter table public.barber_shops
  drop constraint if exists barber_shops_imported_verified_requires_owner;

alter table public.barber_shops
  add constraint barber_shops_imported_verified_requires_owner
  check (
    source_type <> 'imported'
    or verification_status <> 'verified'
    or owner_user_id is not null
  );

create or replace function public.execute_barber_shop_import_batch(
  target_batch_id uuid,
  actor_id uuid,
  include_candidate_rows boolean default false
)
returns table(inserted_count integer, skipped_count integer, failed_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  batch_status text;
begin
  if target_batch_id is null or actor_id is null then
    raise exception 'batch and actor are required' using errcode = '23514';
  end if;

  select status
  into batch_status
  from public.barber_shop_import_batches
  where id = target_batch_id
  for update;

  if batch_status is null then
    raise exception 'import batch not found' using errcode = 'P0002';
  end if;

  if batch_status <> 'previewed' then
    raise exception 'import batch is not executable' using errcode = '23514';
  end if;

  update public.barber_shop_import_rows
  set
    import_status = 'skipped',
    import_error = case
      when cardinality(validation_errors) > 0 then '必須項目または形式エラーがあるため登録しませんでした。'
      when verification_status <> 'unverified' then 'CSV取込では認証状態を変更できないため登録しませんでした。'
      when duplicate_type in ('exact', 'file_exact') then '完全一致の重複として登録しませんでした。'
      when duplicate_type = 'candidate' and include_candidate_rows = false then '重複候補のため確認なしでは登録しませんでした。'
      else import_error
    end
  where batch_id = target_batch_id
    and import_status = 'pending'
    and (
      cardinality(validation_errors) > 0
      or verification_status <> 'unverified'
      or duplicate_type in ('exact', 'file_exact')
      or (duplicate_type = 'candidate' and include_candidate_rows = false)
    );

  update public.barber_shop_import_rows as import_row
  set
    import_status = 'skipped',
    import_error = '登録実行時に完全一致の既存店舗を確認したため登録しませんでした。',
    duplicate_type = 'exact',
    duplicate_shop_ids = array(
      select existing.id
      from public.barber_shops as existing
      where existing.is_deleted = false
        and existing.is_duplicate = false
        and existing.normalized_name = import_row.normalized_name
        and existing.prefecture = import_row.prefecture
        and existing.municipality = import_row.municipality
        and existing.normalized_address = import_row.normalized_address
        and existing.normalized_phone = import_row.normalized_phone
      order by existing.created_at desc
      limit 5
    )
  where import_row.batch_id = target_batch_id
    and import_row.import_status = 'pending'
    and exists (
      select 1
      from public.barber_shops as existing
      where existing.is_deleted = false
        and existing.is_duplicate = false
        and existing.normalized_name = import_row.normalized_name
        and existing.prefecture = import_row.prefecture
        and existing.municipality = import_row.municipality
        and existing.normalized_address = import_row.normalized_address
        and existing.normalized_phone = import_row.normalized_phone
    );

  with rows_to_insert as (
    select
      id,
      row_number,
      name,
      normalized_name,
      prefecture,
      municipality,
      address,
      phone,
      source,
      normalized_address,
      normalized_phone
    from public.barber_shop_import_rows
    where batch_id = target_batch_id
      and import_status = 'pending'
      and verification_status = 'unverified'
    order by row_number asc
  ),
  inserted as (
    insert into public.barber_shops (
      name,
      normalized_name,
      prefecture,
      municipality,
      address,
      phone,
      source,
      normalized_address,
      normalized_phone,
      status,
      verification_status,
      owner_user_id,
      created_by,
      source_type,
      is_public,
      is_deleted,
      is_duplicate
    )
    select
      rows_to_insert.name,
      rows_to_insert.normalized_name,
      rows_to_insert.prefecture,
      rows_to_insert.municipality,
      rows_to_insert.address,
      nullif(rows_to_insert.phone, ''),
      nullif(rows_to_insert.source, ''),
      rows_to_insert.normalized_address,
      rows_to_insert.normalized_phone,
      'public',
      'unverified',
      null,
      actor_id,
      'imported',
      true,
      false,
      false
    from rows_to_insert
    returning id, normalized_name, prefecture, municipality, normalized_address, normalized_phone
  )
  update public.barber_shop_import_rows as import_row
  set
    import_status = 'inserted',
    imported_shop_id = inserted.id,
    import_error = null
  from inserted
  where import_row.batch_id = target_batch_id
    and import_row.import_status = 'pending'
    and import_row.normalized_name = inserted.normalized_name
    and import_row.prefecture = inserted.prefecture
    and import_row.municipality = inserted.municipality
    and import_row.normalized_address = inserted.normalized_address
    and import_row.normalized_phone = inserted.normalized_phone;

  update public.barber_shop_import_rows
  set
    import_status = 'failed',
    import_error = '登録結果を確認できませんでした。'
  where batch_id = target_batch_id
    and import_status = 'pending';

  update public.barber_shop_import_batches
  set
    status = 'imported',
    imported_at = now(),
    inserted_count = (
      select count(*)::integer
      from public.barber_shop_import_rows
      where batch_id = target_batch_id
        and import_status = 'inserted'
    ),
    skipped_count = (
      select count(*)::integer
      from public.barber_shop_import_rows
      where batch_id = target_batch_id
        and import_status = 'skipped'
    ),
    error_count = (
      select count(*)::integer
      from public.barber_shop_import_rows
      where batch_id = target_batch_id
        and (
          cardinality(validation_errors) > 0
          or import_status = 'failed'
        )
    )
  where id = target_batch_id;

  return query
    select
      batches.inserted_count,
      batches.skipped_count,
      batches.error_count
    from public.barber_shop_import_batches as batches
    where batches.id = target_batch_id;
end;
$$;

revoke all on function public.execute_barber_shop_import_batch(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.execute_barber_shop_import_batch(uuid, uuid, boolean) to service_role;
