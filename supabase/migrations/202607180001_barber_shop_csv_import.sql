create or replace function public.normalize_barber_shop_import_text(input text)
returns text
language sql
immutable
as $$
  select lower(
    btrim(
      regexp_replace(
        translate(coalesce(input, ''), '‐‑‒–—―ー－ｰ−', '----------'),
        '[[:space:]　]+',
        ' ',
        'g'
      )
    )
  )
$$;

create or replace function public.normalize_barber_shop_phone(input text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    translate(coalesce(input, ''), '０１２３４５６７８９', '0123456789'),
    '[^0-9]+',
    '',
    'g'
  )
$$;

alter table public.barber_shops
  add column if not exists phone text,
  add column if not exists source text,
  add column if not exists normalized_address text not null default '',
  add column if not exists normalized_phone text not null default '';

alter table public.barber_shops
  drop constraint if exists barber_shops_address_not_blank;

alter table public.barber_shops
  drop constraint if exists barber_shops_verification_status_check;

alter table public.barber_shops
  add constraint barber_shops_verification_status_check
  check (verification_status in ('unverified', 'unclaimed', 'pending', 'verified', 'rejected', 'suspended'));

alter table public.barber_shops
  alter column verification_status set default 'unverified';

update public.barber_shops
set
  normalized_address = public.normalize_barber_shop_import_text(address),
  normalized_phone = public.normalize_barber_shop_phone(phone),
  phone = nullif(btrim(phone), ''),
  source = nullif(btrim(source), '')
where normalized_address = ''
  or normalized_phone = ''
  or phone = ''
  or source = '';

create or replace function public.set_barber_shop_import_columns()
returns trigger
language plpgsql
as $$
begin
  new.phone = nullif(btrim(new.phone), '');
  new.source = nullif(btrim(new.source), '');

  if tg_op = 'INSERT' then
    if new.normalized_address is null
      or (new.normalized_address = '' and coalesce(new.address, '') <> '') then
      new.normalized_address = public.normalize_barber_shop_import_text(new.address);
    end if;

    if new.normalized_phone is null
      or (new.normalized_phone = '' and coalesce(new.phone, '') <> '') then
      new.normalized_phone = public.normalize_barber_shop_phone(new.phone);
    end if;
  else
    if new.address is distinct from old.address then
      new.normalized_address = public.normalize_barber_shop_import_text(new.address);
    end if;

    if new.phone is distinct from old.phone then
      new.normalized_phone = public.normalize_barber_shop_phone(new.phone);
    end if;
  end if;

  new.normalized_address = coalesce(new.normalized_address, '');
  new.normalized_phone = coalesce(new.normalized_phone, '');

  return new;
end;
$$;

drop trigger if exists set_barber_shop_import_columns on public.barber_shops;
create trigger set_barber_shop_import_columns
  before insert or update of address, phone, source on public.barber_shops
  for each row
  execute function public.set_barber_shop_import_columns();

create index if not exists barber_shops_import_duplicate_lookup_idx
  on public.barber_shops(normalized_name, prefecture, municipality, normalized_address, normalized_phone)
  where is_deleted = false
    and is_duplicate = false;

create index if not exists barber_shops_phone_lookup_idx
  on public.barber_shops(normalized_phone)
  where normalized_phone <> ''
    and is_deleted = false
    and is_duplicate = false;

create table if not exists public.barber_shop_import_batches (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  status text not null default 'previewed' check (status in ('previewed', 'imported', 'failed')),
  created_by uuid references public.profiles(id) on delete set null,
  row_count integer not null default 0 check (row_count >= 0),
  valid_row_count integer not null default 0 check (valid_row_count >= 0),
  duplicate_exact_count integer not null default 0 check (duplicate_exact_count >= 0),
  duplicate_candidate_count integer not null default 0 check (duplicate_candidate_count >= 0),
  inserted_count integer not null default 0 check (inserted_count >= 0),
  skipped_count integer not null default 0 check (skipped_count >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  source_summary text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  imported_at timestamptz
);

create table if not exists public.barber_shop_import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.barber_shop_import_batches(id) on delete cascade,
  row_number integer not null check (row_number > 0),
  name text not null default '',
  prefecture text not null default '',
  municipality text not null default '',
  address text not null default '',
  phone text,
  source text,
  verification_status text not null default 'unverified' check (verification_status in ('unverified', 'unclaimed', 'pending', 'verified', 'rejected', 'suspended')),
  normalized_name text not null default '',
  normalized_address text not null default '',
  normalized_phone text not null default '',
  validation_errors text[] not null default array[]::text[],
  duplicate_type text not null default 'none' check (duplicate_type in ('none', 'exact', 'candidate', 'file_exact')),
  duplicate_shop_ids uuid[] not null default array[]::uuid[],
  import_status text not null default 'pending' check (import_status in ('pending', 'inserted', 'skipped', 'failed')),
  imported_shop_id uuid references public.barber_shops(id) on delete set null,
  import_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (batch_id, row_number)
);

create index if not exists barber_shop_import_rows_batch_idx
  on public.barber_shop_import_rows(batch_id, row_number);

create index if not exists barber_shop_import_rows_duplicate_idx
  on public.barber_shop_import_rows(batch_id, duplicate_type, row_number);

create index if not exists barber_shop_import_rows_status_idx
  on public.barber_shop_import_rows(batch_id, import_status, row_number);

drop trigger if exists set_barber_shop_import_batches_updated_at on public.barber_shop_import_batches;
create trigger set_barber_shop_import_batches_updated_at
  before update on public.barber_shop_import_batches
  for each row
  execute function public.set_barber_directory_updated_at();

drop trigger if exists set_barber_shop_import_rows_updated_at on public.barber_shop_import_rows;
create trigger set_barber_shop_import_rows_updated_at
  before update on public.barber_shop_import_rows
  for each row
  execute function public.set_barber_directory_updated_at();

alter table public.barber_shop_import_batches enable row level security;
alter table public.barber_shop_import_rows enable row level security;

revoke all on public.barber_shop_import_batches from anon, authenticated;
revoke all on public.barber_shop_import_rows from anon, authenticated;

revoke insert, delete on public.barber_shops from anon, authenticated;
revoke update on public.barber_shops from anon, authenticated;
grant select on public.barber_shops to anon, authenticated;
grant update (name, normalized_name, prefecture, municipality, address, postal_code, phone)
  on public.barber_shops to authenticated;

create or replace function public.request_barber_shop_claim(
  claim_shop_id uuid,
  claim_relation text,
  claim_message text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_claim_id uuid;
  inserted_claim_id uuid;
  current_status text;
begin
  if current_user_id is null then
    raise exception 'login required' using errcode = '42501';
  end if;

  select verification_status
  into current_status
  from public.barber_shops
  where id = claim_shop_id
    and is_public = true
    and is_deleted = false
    and is_duplicate = false
    and status = 'public';

  if current_status is null then
    raise exception 'shop not found' using errcode = 'P0002';
  end if;

  if current_status in ('verified', 'suspended') then
    raise exception 'shop cannot be claimed' using errcode = '23514';
  end if;

  select id
  into existing_claim_id
  from public.barber_shop_claims
  where shop_id = claim_shop_id
    and user_id = current_user_id
    and status = 'pending'
  limit 1;

  if existing_claim_id is not null then
    return existing_claim_id;
  end if;

  insert into public.barber_shop_claims (
    shop_id,
    user_id,
    status,
    relation_text,
    message
  )
  values (
    claim_shop_id,
    current_user_id,
    'pending',
    nullif(btrim(claim_relation), ''),
    nullif(btrim(claim_message), '')
  )
  returning id into inserted_claim_id;

  update public.barber_shops
  set verification_status = 'pending'
  where id = claim_shop_id
    and verification_status in ('unverified', 'unclaimed', 'rejected');

  return inserted_claim_id;
end;
$$;

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
      when duplicate_type in ('exact', 'file_exact') then '完全一致の重複として登録しませんでした。'
      when duplicate_type = 'candidate' and include_candidate_rows = false then '重複候補のため確認なしでは登録しませんでした。'
      else import_error
    end
  where batch_id = target_batch_id
    and import_status = 'pending'
    and (
      cardinality(validation_errors) > 0
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
      verification_status,
      normalized_address,
      normalized_phone
    from public.barber_shop_import_rows
    where batch_id = target_batch_id
      and import_status = 'pending'
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
      rows_to_insert.verification_status,
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
