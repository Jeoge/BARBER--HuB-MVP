create or replace function public.normalize_barber_shop_name(input text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(coalesce(input, ''), '[[:space:]　]+', '', 'g'))
$$;

create table if not exists public.barber_shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  prefecture text not null,
  municipality text not null,
  address text not null,
  postal_code text,
  status text not null default 'public' check (status in ('public', 'private', 'archived')),
  verification_status text not null default 'unclaimed' check (verification_status in ('unclaimed', 'pending', 'verified', 'rejected', 'suspended')),
  owner_user_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  source_type text not null default 'initial_directory' check (source_type in ('initial_directory', 'owner_created', 'admin_created', 'imported')),
  is_public boolean not null default true,
  is_deleted boolean not null default false,
  is_duplicate boolean not null default false,
  duplicate_of uuid references public.barber_shops(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint barber_shops_name_not_blank check (length(btrim(name)) > 0),
  constraint barber_shops_prefecture_not_blank check (length(btrim(prefecture)) > 0),
  constraint barber_shops_municipality_not_blank check (length(btrim(municipality)) > 0),
  constraint barber_shops_address_not_blank check (length(btrim(address)) > 0),
  constraint barber_shops_normalized_name_not_blank check (length(btrim(normalized_name)) > 0)
);

create index if not exists barber_shops_public_idx
  on public.barber_shops(created_at desc)
  where is_public = true
    and is_deleted = false
    and is_duplicate = false
    and status = 'public'
    and verification_status <> 'suspended';

create index if not exists barber_shops_prefecture_idx
  on public.barber_shops(prefecture, created_at desc)
  where is_public = true
    and is_deleted = false
    and is_duplicate = false
    and status = 'public'
    and verification_status <> 'suspended';

create index if not exists barber_shops_municipality_idx
  on public.barber_shops(prefecture, municipality, created_at desc)
  where is_public = true
    and is_deleted = false
    and is_duplicate = false
    and status = 'public'
    and verification_status <> 'suspended';

create index if not exists barber_shops_verification_idx
  on public.barber_shops(verification_status, created_at desc)
  where is_public = true
    and is_deleted = false
    and is_duplicate = false
    and status = 'public';

create index if not exists barber_shops_normalized_name_idx
  on public.barber_shops(normalized_name text_pattern_ops);

create unique index if not exists barber_shops_directory_unique_idx
  on public.barber_shops(normalized_name, prefecture, municipality, lower(btrim(address)))
  where is_deleted = false
    and is_duplicate = false;

create table if not exists public.barber_shop_claims (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.barber_shops(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'canceled')),
  relation_text text,
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);

create unique index if not exists barber_shop_claims_one_pending_per_user_idx
  on public.barber_shop_claims(shop_id, user_id)
  where status = 'pending';

create index if not exists barber_shop_claims_user_idx
  on public.barber_shop_claims(user_id, created_at desc);

create index if not exists barber_shop_claims_shop_idx
  on public.barber_shop_claims(shop_id, created_at desc);

create or replace function public.set_barber_directory_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_barber_shops_updated_at on public.barber_shops;
create trigger set_barber_shops_updated_at
  before update on public.barber_shops
  for each row
  execute function public.set_barber_directory_updated_at();

drop trigger if exists set_barber_shop_claims_updated_at on public.barber_shop_claims;
create trigger set_barber_shop_claims_updated_at
  before update on public.barber_shop_claims
  for each row
  execute function public.set_barber_directory_updated_at();

alter table public.barber_shops enable row level security;
alter table public.barber_shop_claims enable row level security;

drop policy if exists "barber_shops_select_public_or_own" on public.barber_shops;
create policy "barber_shops_select_public_or_own"
  on public.barber_shops
  for select
  to anon, authenticated
  using (
    (
      is_public = true
      and is_deleted = false
      and is_duplicate = false
      and status = 'public'
      and verification_status <> 'suspended'
    )
    or auth.uid() = owner_user_id
    or auth.uid() = created_by
  );

drop policy if exists "barber_shops_insert_own_pending" on public.barber_shops;
create policy "barber_shops_insert_own_pending"
  on public.barber_shops
  for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and owner_user_id is null
    and source_type = 'owner_created'
    and verification_status in ('unclaimed', 'pending')
    and status = 'public'
    and is_public = true
    and is_deleted = false
    and is_duplicate = false
  );

drop policy if exists "barber_shops_update_verified_owner" on public.barber_shops;
create policy "barber_shops_update_verified_owner"
  on public.barber_shops
  for update
  to authenticated
  using (
    auth.uid() = owner_user_id
    and verification_status = 'verified'
    and is_deleted = false
  )
  with check (
    auth.uid() = owner_user_id
    and verification_status = 'verified'
    and is_deleted = false
    and is_duplicate = false
  );

drop policy if exists "barber_shop_claims_select_own" on public.barber_shop_claims;
create policy "barber_shop_claims_select_own"
  on public.barber_shop_claims
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "barber_shop_claims_insert_own_pending" on public.barber_shop_claims;
create policy "barber_shop_claims_insert_own_pending"
  on public.barber_shop_claims
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and exists (
      select 1
      from public.barber_shops
      where barber_shops.id = barber_shop_claims.shop_id
        and barber_shops.is_public = true
        and barber_shops.is_deleted = false
        and barber_shops.is_duplicate = false
        and barber_shops.status = 'public'
        and barber_shops.verification_status not in ('verified', 'suspended')
    )
  );

create or replace function public.get_public_barber_shop_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)
  from public.barber_shops
  where is_public = true
    and is_deleted = false
    and is_duplicate = false
    and status = 'public'
    and verification_status <> 'suspended'
$$;

create or replace function public.list_barber_shop_municipalities(shop_prefecture text)
returns table(municipality text, shop_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select barber_shops.municipality, count(*) as shop_count
  from public.barber_shops
  where is_public = true
    and is_deleted = false
    and is_duplicate = false
    and status = 'public'
    and verification_status <> 'suspended'
    and prefecture = btrim(shop_prefecture)
  group by barber_shops.municipality
  order by barber_shops.municipality asc
  limit 200
$$;

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
    and verification_status in ('unclaimed', 'rejected');

  return inserted_claim_id;
end;
$$;

create or replace function public.create_barber_shop_with_claim(
  shop_name text,
  normalized_shop_name text,
  shop_prefecture text,
  shop_municipality text,
  shop_address text,
  shop_postal_code text,
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
  new_shop_id uuid;
begin
  if current_user_id is null then
    raise exception 'login required' using errcode = '42501';
  end if;

  if length(btrim(coalesce(shop_name, ''))) = 0
    or length(btrim(coalesce(normalized_shop_name, ''))) = 0
    or length(btrim(coalesce(shop_prefecture, ''))) = 0
    or length(btrim(coalesce(shop_municipality, ''))) = 0
    or length(btrim(coalesce(shop_address, ''))) = 0 then
    raise exception 'required shop fields are missing' using errcode = '23514';
  end if;

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
  values (
    btrim(shop_name),
    btrim(normalized_shop_name),
    btrim(shop_prefecture),
    btrim(shop_municipality),
    btrim(shop_address),
    nullif(btrim(shop_postal_code), ''),
    'public',
    'pending',
    null,
    current_user_id,
    'owner_created',
    true,
    false,
    false
  )
  returning id into new_shop_id;

  insert into public.barber_shop_claims (
    shop_id,
    user_id,
    status,
    relation_text,
    message
  )
  values (
    new_shop_id,
    current_user_id,
    'pending',
    nullif(btrim(claim_relation), ''),
    nullif(btrim(claim_message), '')
  );

  return new_shop_id;
end;
$$;

grant execute on function public.get_public_barber_shop_count() to anon, authenticated;
grant execute on function public.list_barber_shop_municipalities(text) to anon, authenticated;
grant execute on function public.request_barber_shop_claim(uuid, text, text) to authenticated;
grant execute on function public.create_barber_shop_with_claim(text, text, text, text, text, text, text, text) to authenticated;
