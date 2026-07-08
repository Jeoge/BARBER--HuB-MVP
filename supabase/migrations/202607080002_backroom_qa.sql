create table if not exists public.backroom_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  body text not null check (char_length(btrim(body)) between 1 and 6000),
  category text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

alter table public.backroom_posts enable row level security;

-- Category checks use PostgreSQL Unicode escape strings to avoid SQL Editor
-- copy/paste mojibake with Japanese text. The values are:
-- eigyo-go talk / soudan / keiei / dokuritsu / staff / syukyaku /
-- gijutsu / zairyo / STU / assistant / shumi / zatsudan.
alter table public.backroom_posts
  drop constraint if exists backroom_posts_category_check;

alter table public.backroom_posts
  add constraint backroom_posts_category_check
  check (
    category = U&'\55B6\696D\5F8C\30C8\30FC\30AF'
    or category = U&'\76F8\8AC7'
    or category = U&'\7D4C\55B6'
    or category = U&'\72EC\7ACB'
    or category = U&'\30B9\30BF\30C3\30D5'
    or category = U&'\96C6\5BA2'
    or category = U&'\6280\8853'
    or category = U&'\6750\6599'
    or category = 'STU'
    or category = U&'\30A2\30B7\30B9\30BF\30F3\30C8'
    or category = U&'\8DA3\5473'
    or category = U&'\96D1\8AC7'
  ) not valid;

create index if not exists backroom_posts_user_created_idx
  on public.backroom_posts(user_id, created_at desc);

create index if not exists backroom_posts_visible_created_idx
  on public.backroom_posts(created_at desc)
  where is_deleted = false;

drop policy if exists "backroom_posts_select_authenticated" on public.backroom_posts;
create policy "backroom_posts_select_authenticated"
  on public.backroom_posts
  for select
  to authenticated
  using (is_deleted = false or auth.uid() = user_id);

drop policy if exists "backroom_posts_insert_own" on public.backroom_posts;
create policy "backroom_posts_insert_own"
  on public.backroom_posts
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and is_deleted = false
  );

drop policy if exists "backroom_posts_update_own" on public.backroom_posts;
create policy "backroom_posts_update_own"
  on public.backroom_posts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "backroom_posts_delete_own" on public.backroom_posts;
create policy "backroom_posts_delete_own"
  on public.backroom_posts
  for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.backroom_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.backroom_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

alter table public.backroom_comments enable row level security;

create index if not exists backroom_comments_post_created_idx
  on public.backroom_comments(post_id, created_at)
  where is_deleted = false;

create index if not exists backroom_comments_user_created_idx
  on public.backroom_comments(user_id, created_at desc);

drop policy if exists "backroom_comments_select_authenticated" on public.backroom_comments;
create policy "backroom_comments_select_authenticated"
  on public.backroom_comments
  for select
  to authenticated
  using (is_deleted = false);

drop policy if exists "backroom_comments_insert_own" on public.backroom_comments;
create policy "backroom_comments_insert_own"
  on public.backroom_comments
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and is_deleted = false
    and exists (
      select 1
      from public.backroom_posts
      where id = post_id
        and is_deleted = false
    )
  );

drop policy if exists "backroom_comments_update_own" on public.backroom_comments;
create policy "backroom_comments_update_own"
  on public.backroom_comments
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "backroom_comments_delete_own" on public.backroom_comments;
create policy "backroom_comments_delete_own"
  on public.backroom_comments
  for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.qa_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  body text not null check (char_length(btrim(body)) between 1 and 6000),
  category text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false,
  is_resolved boolean not null default false
);

alter table public.qa_questions enable row level security;

-- Q&A keeps the "other" category by design.
alter table public.qa_questions
  drop constraint if exists qa_questions_category_check;

alter table public.qa_questions
  add constraint qa_questions_category_check
  check (
    category = U&'\6280\8853'
    or category = U&'\7D4C\55B6'
    or category = U&'\96C6\5BA2'
    or category = U&'\6C42\4EBA'
    or category = U&'\6750\6599'
    or category = U&'\72EC\7ACB'
    or category = U&'\7A0E\52D9'
    or category = U&'\7D44\5408'
    or category = U&'\5B66\6821'
    or category = 'STU'
    or category = U&'\30A2\30B7\30B9\30BF\30F3\30C8'
    or category = U&'\305D\306E\4ED6'
  ) not valid;

create index if not exists qa_questions_user_created_idx
  on public.qa_questions(user_id, created_at desc);

create index if not exists qa_questions_visible_created_idx
  on public.qa_questions(created_at desc)
  where is_deleted = false;

drop policy if exists "qa_questions_select_visible" on public.qa_questions;
create policy "qa_questions_select_visible"
  on public.qa_questions
  for select
  to anon, authenticated
  using (is_deleted = false or auth.uid() = user_id);

drop policy if exists "qa_questions_insert_own" on public.qa_questions;
create policy "qa_questions_insert_own"
  on public.qa_questions
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and is_deleted = false
  );

drop policy if exists "qa_questions_update_own" on public.qa_questions;
create policy "qa_questions_update_own"
  on public.qa_questions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "qa_questions_delete_own" on public.qa_questions;
create policy "qa_questions_delete_own"
  on public.qa_questions
  for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.qa_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.qa_questions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false,
  is_best_answer boolean not null default false
);

alter table public.qa_answers enable row level security;

create index if not exists qa_answers_question_created_idx
  on public.qa_answers(question_id, created_at)
  where is_deleted = false;

create index if not exists qa_answers_user_created_idx
  on public.qa_answers(user_id, created_at desc);

drop policy if exists "qa_answers_select_visible" on public.qa_answers;
create policy "qa_answers_select_visible"
  on public.qa_answers
  for select
  to anon, authenticated
  using (is_deleted = false);

drop policy if exists "qa_answers_insert_own" on public.qa_answers;
create policy "qa_answers_insert_own"
  on public.qa_answers
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and is_deleted = false
    and exists (
      select 1
      from public.qa_questions
      where id = question_id
        and is_deleted = false
    )
  );

drop policy if exists "qa_answers_update_own" on public.qa_answers;
create policy "qa_answers_update_own"
  on public.qa_answers
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "qa_answers_delete_own" on public.qa_answers;
create policy "qa_answers_delete_own"
  on public.qa_answers
  for delete
  to authenticated
  using (auth.uid() = user_id);
