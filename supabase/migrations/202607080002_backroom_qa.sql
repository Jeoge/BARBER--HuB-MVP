create table if not exists public.backroom_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  body text not null check (char_length(btrim(body)) between 1 and 6000),
  category text not null check (category in (
    '営業後トーク',
    '相談',
    '経営',
    '独立',
    'スタッフ',
    '集客',
    '技術',
    '材料',
    'STU',
    'アシスタント',
    '趣味',
    '雑談'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

create index if not exists backroom_posts_user_created_idx
  on public.backroom_posts(user_id, created_at desc);

create index if not exists backroom_posts_visible_created_idx
  on public.backroom_posts(created_at desc)
  where is_deleted = false;

alter table public.backroom_posts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'backroom_posts'
      and policyname = 'backroom_posts_select_authenticated'
  ) then
    create policy "backroom_posts_select_authenticated"
      on public.backroom_posts
      for select
      to authenticated
      using (is_deleted = false or auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'backroom_posts'
      and policyname = 'backroom_posts_insert_own'
  ) then
    create policy "backroom_posts_insert_own"
      on public.backroom_posts
      for insert
      to authenticated
      with check (
        auth.uid() = user_id
        and is_deleted = false
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'backroom_posts'
      and policyname = 'backroom_posts_update_own'
  ) then
    create policy "backroom_posts_update_own"
      on public.backroom_posts
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'backroom_posts'
      and policyname = 'backroom_posts_delete_own'
  ) then
    create policy "backroom_posts_delete_own"
      on public.backroom_posts
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

create table if not exists public.backroom_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.backroom_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

create index if not exists backroom_comments_post_created_idx
  on public.backroom_comments(post_id, created_at)
  where is_deleted = false;

create index if not exists backroom_comments_user_created_idx
  on public.backroom_comments(user_id, created_at desc);

alter table public.backroom_comments enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'backroom_comments'
      and policyname = 'backroom_comments_select_authenticated'
  ) then
    create policy "backroom_comments_select_authenticated"
      on public.backroom_comments
      for select
      to authenticated
      using (is_deleted = false);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'backroom_comments'
      and policyname = 'backroom_comments_insert_own'
  ) then
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
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'backroom_comments'
      and policyname = 'backroom_comments_update_own'
  ) then
    create policy "backroom_comments_update_own"
      on public.backroom_comments
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'backroom_comments'
      and policyname = 'backroom_comments_delete_own'
  ) then
    create policy "backroom_comments_delete_own"
      on public.backroom_comments
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

create table if not exists public.qa_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  body text not null check (char_length(btrim(body)) between 1 and 6000),
  category text not null check (category in (
    '技術',
    '経営',
    '集客',
    '求人',
    '材料',
    '独立',
    '税務',
    '組合',
    '学校',
    'STU',
    'アシスタント',
    'その他'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false,
  is_resolved boolean not null default false
);

create index if not exists qa_questions_user_created_idx
  on public.qa_questions(user_id, created_at desc);

create index if not exists qa_questions_visible_created_idx
  on public.qa_questions(created_at desc)
  where is_deleted = false;

alter table public.qa_questions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'qa_questions'
      and policyname = 'qa_questions_select_visible'
  ) then
    create policy "qa_questions_select_visible"
      on public.qa_questions
      for select
      to anon, authenticated
      using (is_deleted = false or auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'qa_questions'
      and policyname = 'qa_questions_insert_own'
  ) then
    create policy "qa_questions_insert_own"
      on public.qa_questions
      for insert
      to authenticated
      with check (
        auth.uid() = user_id
        and is_deleted = false
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'qa_questions'
      and policyname = 'qa_questions_update_own'
  ) then
    create policy "qa_questions_update_own"
      on public.qa_questions
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'qa_questions'
      and policyname = 'qa_questions_delete_own'
  ) then
    create policy "qa_questions_delete_own"
      on public.qa_questions
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

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

create index if not exists qa_answers_question_created_idx
  on public.qa_answers(question_id, created_at)
  where is_deleted = false;

create index if not exists qa_answers_user_created_idx
  on public.qa_answers(user_id, created_at desc);

alter table public.qa_answers enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'qa_answers'
      and policyname = 'qa_answers_select_visible'
  ) then
    create policy "qa_answers_select_visible"
      on public.qa_answers
      for select
      to anon, authenticated
      using (is_deleted = false);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'qa_answers'
      and policyname = 'qa_answers_insert_own'
  ) then
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
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'qa_answers'
      and policyname = 'qa_answers_update_own'
  ) then
    create policy "qa_answers_update_own"
      on public.qa_answers
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'qa_answers'
      and policyname = 'qa_answers_delete_own'
  ) then
    create policy "qa_answers_delete_own"
      on public.qa_answers
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;
