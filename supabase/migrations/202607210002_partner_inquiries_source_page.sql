alter table public.partner_inquiries
  alter column source_page set default '/partners/contact';

alter table public.partner_inquiries
  drop constraint if exists partner_inquiries_source_page_check;

alter table public.partner_inquiries
  add constraint partner_inquiries_source_page_check
  check (source_page = '/partners/contact');
