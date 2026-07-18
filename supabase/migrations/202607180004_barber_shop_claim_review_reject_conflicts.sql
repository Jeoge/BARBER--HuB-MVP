create or replace function public.review_barber_shop_claim(
  target_claim_id uuid,
  review_action text,
  reviewer_user_id uuid,
  reviewer_note text default null
)
returns table(
  claim_id uuid,
  shop_id uuid,
  applicant_user_id uuid,
  resulting_claim_status text,
  resulting_shop_verification_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_shop_id uuid;
  claim_record public.barber_shop_claims%rowtype;
  shop_record public.barber_shops%rowtype;
  normalized_action text := lower(btrim(coalesce(review_action, '')));
  cleaned_note text := nullif(btrim(coalesce(reviewer_note, '')), '');
  auto_reject_note text := '同じ店舗の別申請が店舗管理者として承認されたため自動却下';
  has_other_pending_claim boolean := false;
  rejected_shop_status text := 'unverified';
begin
  if target_claim_id is null or reviewer_user_id is null then
    raise exception 'claim and reviewer are required' using errcode = '23514';
  end if;

  if normalized_action not in ('approve', 'reject') then
    raise exception 'invalid review action' using errcode = '23514';
  end if;

  lock table public.barber_shop_claims in share row exclusive mode;

  select shop_id
  into target_shop_id
  from public.barber_shop_claims
  where id = target_claim_id;

  if target_shop_id is null then
    raise exception 'claim not found' using errcode = 'P0002';
  end if;

  select *
  into shop_record
  from public.barber_shops
  where id = target_shop_id
  for update;

  if shop_record.id is null
    or shop_record.is_deleted = true
    or shop_record.is_duplicate = true then
    raise exception 'shop cannot be reviewed' using errcode = '23514';
  end if;

  select *
  into claim_record
  from public.barber_shop_claims
  where id = target_claim_id
  for update;

  if claim_record.id is null then
    raise exception 'claim not found' using errcode = 'P0002';
  end if;

  if claim_record.status <> 'pending' then
    raise exception 'claim is not pending' using errcode = '23514';
  end if;

  if claim_record.shop_id <> shop_record.id then
    raise exception 'claim shop mismatch' using errcode = '23514';
  end if;

  if normalized_action = 'approve' then
    if shop_record.verification_status = 'verified'
      and shop_record.owner_user_id is not null
      and shop_record.owner_user_id <> claim_record.user_id then
      raise exception 'shop already verified by another user' using errcode = '23505';
    end if;

    update public.barber_shops
    set
      owner_user_id = claim_record.user_id,
      verification_status = 'verified',
      updated_at = now()
    where id = claim_record.shop_id;

    update public.barber_shop_claims
    set
      status = 'approved',
      reviewed_at = now(),
      reviewed_by = reviewer_user_id,
      review_note = cleaned_note,
      updated_at = now()
    where id = claim_record.id;

    update public.barber_shop_claims
    set
      status = 'rejected',
      reviewed_at = now(),
      reviewed_by = reviewer_user_id,
      review_note = auto_reject_note,
      updated_at = now()
    where shop_id = claim_record.shop_id
      and id <> claim_record.id
      and status = 'pending';

    return query
      select
        claim_record.id,
        claim_record.shop_id,
        claim_record.user_id,
        'approved'::text,
        'verified'::text;
    return;
  end if;

  select exists (
    select 1
    from public.barber_shop_claims
    where shop_id = claim_record.shop_id
      and id <> claim_record.id
      and status = 'pending'
  )
  into has_other_pending_claim;

  update public.barber_shop_claims
  set
    status = 'rejected',
    reviewed_at = now(),
    reviewed_by = reviewer_user_id,
    review_note = cleaned_note,
    updated_at = now()
  where id = claim_record.id;

  if shop_record.verification_status = 'verified'
    and shop_record.owner_user_id is not null
    and shop_record.owner_user_id <> claim_record.user_id then
    rejected_shop_status := 'verified';
  else
    rejected_shop_status := case when has_other_pending_claim then 'pending' else 'unverified' end;

    update public.barber_shops
    set
      owner_user_id = null,
      verification_status = rejected_shop_status,
      updated_at = now()
    where id = claim_record.shop_id;
  end if;

  return query
    select
      claim_record.id,
      claim_record.shop_id,
      claim_record.user_id,
      'rejected'::text,
      rejected_shop_status;
end;
$$;

revoke all on function public.review_barber_shop_claim(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.review_barber_shop_claim(uuid, text, uuid, text) to service_role;
