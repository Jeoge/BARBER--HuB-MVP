-- Test seed for PR18 store-directory production connection verification.
-- Run this manually from Supabase SQL Editor after
-- supabase/migrations/202607100001_barber_shop_directory.sql has been applied.
--
-- This seed is idempotent for the active BARBER HUB TEST rows below.
-- It updates existing matching test rows and inserts only missing rows.
--
-- Cleanup after verification:
--
-- delete from public.barber_shops
-- where name like 'BARBER HUB TEST %'
--   and source_type = 'admin_created'
--   and owner_user_id is null
--   and created_by is null;

begin;

with seed_data (
  name,
  prefecture,
  municipality,
  address,
  postal_code,
  verification_status
) as (
  values
    ('BARBER HUB TEST 西区店', '福岡県', '福岡市西区', '福岡県福岡市西区 BARBER HUB TEST-DATA-001', null::text, 'verified'),
    ('BARBER HUB TEST 博多店', '福岡県', '福岡市博多区', '福岡県福岡市博多区 BARBER HUB TEST-DATA-002', null::text, 'unclaimed'),
    ('BARBER HUB TEST 天神店', '福岡県', '福岡市中央区', '福岡県福岡市中央区 BARBER HUB TEST-DATA-003', null::text, 'verified'),
    ('BARBER HUB TEST 小倉店', '福岡県', '北九州市小倉北区', '福岡県北九州市小倉北区 BARBER HUB TEST-DATA-004', null::text, 'unclaimed'),
    ('BARBER HUB TEST 久留米店', '福岡県', '久留米市', '福岡県久留米市 BARBER HUB TEST-DATA-005', null::text, 'verified'),
    ('BARBER HUB TEST 飯塚店', '福岡県', '飯塚市', '福岡県飯塚市 BARBER HUB TEST-DATA-006', null::text, 'unclaimed'),
    ('BARBER HUB TEST 春日店', '福岡県', '春日市', '福岡県春日市 BARBER HUB TEST-DATA-007', null::text, 'verified'),
    ('BARBER HUB TEST 糸島店', '福岡県', '糸島市', '福岡県糸島市 BARBER HUB TEST-DATA-008', null::text, 'unclaimed')
),
prepared as (
  select
    name,
    public.normalize_barber_shop_name(name) as normalized_name,
    prefecture,
    municipality,
    address,
    postal_code,
    'public'::text as status,
    verification_status,
    null::uuid as owner_user_id,
    null::uuid as created_by,
    'admin_created'::text as source_type,
    true as is_public,
    false as is_deleted,
    false as is_duplicate
  from seed_data
),
updated as (
  update public.barber_shops as target
  set
    name = prepared.name,
    postal_code = prepared.postal_code,
    status = prepared.status,
    verification_status = prepared.verification_status,
    owner_user_id = prepared.owner_user_id,
    created_by = prepared.created_by,
    source_type = prepared.source_type,
    is_public = prepared.is_public,
    is_deleted = prepared.is_deleted,
    is_duplicate = prepared.is_duplicate,
    duplicate_of = null,
    updated_at = now()
  from prepared
  where target.normalized_name = prepared.normalized_name
    and target.prefecture = prepared.prefecture
    and target.municipality = prepared.municipality
    and lower(btrim(target.address)) = lower(btrim(prepared.address))
    and target.name like 'BARBER HUB TEST %'
  returning
    prepared.normalized_name,
    prepared.prefecture,
    prepared.municipality,
    prepared.address
)
insert into public.barber_shops (
  name,
  normalized_name,
  prefecture,
  municipality,
  address,
  postal_code,
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
  prepared.name,
  prepared.normalized_name,
  prepared.prefecture,
  prepared.municipality,
  prepared.address,
  prepared.postal_code,
  prepared.status,
  prepared.verification_status,
  prepared.owner_user_id,
  prepared.created_by,
  prepared.source_type,
  prepared.is_public,
  prepared.is_deleted,
  prepared.is_duplicate
from prepared
where not exists (
  select 1
  from public.barber_shops as existing
  where existing.normalized_name = prepared.normalized_name
    and existing.prefecture = prepared.prefecture
    and existing.municipality = prepared.municipality
    and lower(btrim(existing.address)) = lower(btrim(prepared.address))
    and existing.is_deleted = false
    and existing.is_duplicate = false
)
and not exists (
  select 1
  from updated
  where updated.normalized_name = prepared.normalized_name
    and updated.prefecture = prepared.prefecture
    and updated.municipality = prepared.municipality
    and lower(btrim(updated.address)) = lower(btrim(prepared.address))
);

commit;

select
  count(*) as seeded_test_shop_count,
  count(*) filter (where verification_status = 'verified') as verified_test_shop_count,
  count(*) filter (where verification_status = 'unclaimed') as unclaimed_test_shop_count
from public.barber_shops
where name like 'BARBER HUB TEST %'
  and source_type = 'admin_created'
  and is_public = true
  and is_deleted = false
  and is_duplicate = false;
