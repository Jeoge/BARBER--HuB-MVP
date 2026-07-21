create table if not exists public.partner_inquiries (
  id uuid primary key default gen_random_uuid(),
  inquiry_type text,
  contact_name text not null,
  organization_name text,
  email text not null,
  phone text,
  website_url text,
  message text not null,
  status text not null default 'new',
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  source_page text not null default '/partners',
  constraint partner_inquiries_type_check check (
    inquiry_type is null or inquiry_type in ('協賛について', '広告掲載について', 'タイアップ・共同企画について', 'その他')
  ),
  constraint partner_inquiries_contact_name_check check (char_length(btrim(contact_name)) between 1 and 100),
  constraint partner_inquiries_organization_name_check check (organization_name is null or char_length(organization_name) <= 160),
  constraint partner_inquiries_email_check check (
    char_length(email) between 3 and 254
    and email !~ '[\r\n]'
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint partner_inquiries_phone_check check (phone is null or char_length(phone) <= 50),
  constraint partner_inquiries_website_url_check check (
    website_url is null or (
      char_length(website_url) <= 500
      and website_url ~* '^https?://[^[:space:]]+$'
    )
  ),
  constraint partner_inquiries_message_check check (char_length(btrim(message)) between 20 and 5000),
  constraint partner_inquiries_status_check check (status in ('new', 'in_progress', 'replied', 'closed', 'spam')),
  constraint partner_inquiries_admin_note_check check (admin_note is null or char_length(admin_note) <= 5000),
  constraint partner_inquiries_source_page_check check (source_page = '/partners')
);

create index if not exists partner_inquiries_email_created_idx
  on public.partner_inquiries(email, created_at desc);

create index if not exists partner_inquiries_status_created_idx
  on public.partner_inquiries(status, created_at desc);

alter table public.partner_inquiries enable row level security;

revoke all on table public.partner_inquiries from anon, authenticated;
grant all on table public.partner_inquiries to service_role;
