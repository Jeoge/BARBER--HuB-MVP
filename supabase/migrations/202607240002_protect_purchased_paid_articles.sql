-- Keep the paid content purchased by readers available even when an author
-- attempts to bypass the article edit UI. A partial refund still leaves the
-- purchase entitled, so it is purchase history for this protection as well.

create or replace function public.prevent_purchased_paid_article_downgrade()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if exists (
    select 1
    from public.paid_article_purchases
    where article_id = old.id
      and status in ('completed', 'partially_refunded')
  ) then
    if old.access_type = 'paid' and new.access_type is distinct from 'paid' then
      raise exception 'Purchased paid articles cannot be changed to free access.';
    end if;

    if old.is_deleted is not true and new.is_deleted is true then
      raise exception 'Purchased paid articles cannot be deleted.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_purchased_paid_article on public.articles;
create trigger protect_purchased_paid_article
  before update of access_type, is_deleted on public.articles
  for each row execute function public.prevent_purchased_paid_article_downgrade();

create or replace function public.prevent_purchased_paid_section_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if exists (
    select 1
    from public.paid_article_purchases
    where article_id = old.article_id
      and status in ('completed', 'partially_refunded')
  ) then
    raise exception 'Paid content with purchase history cannot be changed or deleted.';
  end if;

  if tg_op = 'UPDATE' and exists (
    select 1
    from public.paid_article_purchases
    where article_id = new.article_id
      and status in ('completed', 'partially_refunded')
  ) then
    raise exception 'Paid content with purchase history cannot be changed or deleted.';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists protect_purchased_paid_section on public.article_paid_sections;
create trigger protect_purchased_paid_section
  before update or delete on public.article_paid_sections
  for each row execute function public.prevent_purchased_paid_section_change();

drop policy if exists "article_paid_sections_update_own" on public.article_paid_sections;
create policy "article_paid_sections_update_own"
  on public.article_paid_sections for update to authenticated
  using (
    exists (
      select 1 from public.articles
      where articles.id = article_paid_sections.article_id
        and articles.author_id = auth.uid()
    )
    and not exists (
      select 1 from public.paid_article_purchases
      where paid_article_purchases.article_id = article_paid_sections.article_id
        and paid_article_purchases.status in ('completed', 'partially_refunded')
    )
  )
  with check (
    exists (
      select 1 from public.articles
      where articles.id = article_paid_sections.article_id
        and articles.author_id = auth.uid()
    )
    and not exists (
      select 1 from public.paid_article_purchases
      where paid_article_purchases.article_id = article_paid_sections.article_id
        and paid_article_purchases.status in ('completed', 'partially_refunded')
    )
  );

drop policy if exists "article_paid_sections_delete_own" on public.article_paid_sections;
create policy "article_paid_sections_delete_own"
  on public.article_paid_sections for delete to authenticated
  using (
    exists (
      select 1 from public.articles
      where articles.id = article_paid_sections.article_id
        and articles.author_id = auth.uid()
    )
    and not exists (
      select 1 from public.paid_article_purchases
      where paid_article_purchases.article_id = article_paid_sections.article_id
        and paid_article_purchases.status in ('completed', 'partially_refunded')
    )
  );
