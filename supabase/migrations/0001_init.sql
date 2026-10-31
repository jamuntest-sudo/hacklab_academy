create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text unique,
  display_name text,
  bio text,
  avatar_url text,
  xp integer not null default 0 check (xp >= 0),
  status text not null default 'active' check (status in ('active', 'suspended')),
  email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text not null,
  level smallint not null check (level between 1 and 4),
  duration_minutes integer not null default 45,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  slug text not null,
  title text not null,
  summary text not null,
  content jsonb not null default '[]'::jsonb,
  has_terminal boolean not null default false,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug)
);

create table if not exists public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text not null,
  level smallint not null check (level between 1 and 4),
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.learning_path_courses (
  path_id uuid not null references public.learning_paths (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (path_id, course_id)
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text not null,
  description text not null,
  category text not null check (category in ('beginner', 'intermediate', 'advanced', 'expert')),
  challenge_type text not null default 'standard' check (challenge_type in ('standard', 'terminal', 'lab', 'quiz', 'simulator')),
  difficulty smallint not null check (difficulty between 1 and 5),
  xp_reward integer not null check (xp_reward > 0),
  published boolean not null default true,
  enabled boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.challenge_flags (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  flag_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.challenge_hints (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  sort_order integer not null default 0,
  body text not null,
  xp_cost integer not null default 0
);

create table if not exists public.challenge_submissions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  correct boolean not null,
  created_at timestamptz not null default now()
);

create unique index if not exists challenge_submissions_first_solve
  on public.challenge_submissions (challenge_id, user_id)
  where correct = true;

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  prompt text not null,
  choices jsonb not null,
  sort_order integer not null default 0
);

create table if not exists public.quiz_answers (
  question_id uuid primary key references public.quiz_questions (id) on delete cascade,
  correct_index integer not null
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  selected_index integer not null,
  correct boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid references public.courses (id) on delete cascade,
  lesson_id uuid references public.lessons (id) on delete cascade,
  challenge_id uuid references public.challenges (id) on delete cascade,
  status text not null default 'completed' check (status in ('started', 'completed', 'reset')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_progress_lesson_unique
  on public.user_progress (user_id, lesson_id)
  where lesson_id is not null;

create unique index if not exists user_progress_challenge_unique
  on public.user_progress (user_id, challenge_id)
  where challenge_id is not null;

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null
);

create table if not exists public.user_achievements (
  user_id uuid not null references public.profiles (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table if not exists public.lab_templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text not null,
  image_ref text not null,
  cpu_limit text not null default '0.50',
  memory_limit text not null default '512m',
  expires_minutes integer not null default 60,
  enabled boolean not null default true
);

create table if not exists public.lab_instances (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.lab_templates (id),
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'running', 'stopped', 'expired', 'error')),
  gateway_ref text,
  expires_at timestamptz,
  resource_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.terminal_files (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges (id) on delete cascade,
  path text not null,
  is_dir boolean not null default false,
  content text,
  unique (challenge_id, path)
);

create table if not exists public.admin_owners (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_email text,
  action text not null,
  target text,
  metadata jsonb not null default '{}'::jsonb,
  ip inet,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  brand_name text not null default 'HackLab Academy',
  announcement text,
  maintenance_mode boolean not null default false,
  course_enrollment_open boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  topic text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists profiles_xp_idx on public.profiles (xp desc);
create index if not exists challenges_category_idx on public.challenges (category, enabled, published);
create index if not exists submissions_user_idx on public.challenge_submissions (user_id, created_at desc);
create index if not exists audit_created_idx on public.admin_audit_logs (created_at desc);
create index if not exists lab_instances_user_idx on public.lab_instances (user_id, status);
create index if not exists courses_level_idx on public.courses (level, published);

insert into public.site_settings (id) values (1) on conflict do nothing;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated on public.profiles;
create trigger profiles_updated before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, handle, display_name, email_verified)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'handle', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.email_confirmed_at is not null, false)
  );
  insert into public.user_achievements (user_id, achievement_id)
  select new.id, a.id from public.achievements a where a.slug = 'first-login'
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.learning_paths enable row level security;
alter table public.learning_path_courses enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_flags enable row level security;
alter table public.challenge_hints enable row level security;
alter table public.challenge_submissions enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.user_progress enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.lab_templates enable row level security;
alter table public.lab_instances enable row level security;
alter table public.terminal_files enable row level security;
alter table public.admin_owners enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.site_settings enable row level security;
alter table public.contact_messages enable row level security;
alter table public.xp_events enable row level security;

create policy "public read published courses" on public.courses for select using (published = true);
create policy "public read published lessons" on public.lessons for select using (published = true);
create policy "public read paths" on public.learning_paths for select using (published = true);
create policy "public read path courses" on public.learning_path_courses for select using (true);
create policy "public read published challenges" on public.challenges for select using (published = true and enabled = true);
create policy "public read hints" on public.challenge_hints for select using (true);
create policy "public read questions" on public.quiz_questions for select using (true);
create policy "public read achievements" on public.achievements for select using (true);
create policy "public read lab templates" on public.lab_templates for select using (enabled = true);
create policy "public read settings" on public.site_settings for select using (true);
create policy "public read leaderboard profiles" on public.profiles for select using (status = 'active');

create policy "read own submissions" on public.challenge_submissions for select using (auth.uid() = user_id);
create policy "read own quiz attempts" on public.quiz_attempts for select using (auth.uid() = user_id);
create policy "read own progress" on public.user_progress for select using (auth.uid() = user_id);
create policy "read own badges" on public.user_achievements for select using (auth.uid() = user_id);
create policy "read own labs" on public.lab_instances for select using (auth.uid() = user_id);
create policy "read own xp events" on public.xp_events for select using (auth.uid() = user_id);

create policy "update own profile identity" on public.profiles
for update using (auth.uid() = id)
with check (auth.uid() = id);

revoke all on public.challenge_flags from anon, authenticated;
revoke all on public.quiz_answers from anon, authenticated;
revoke all on public.admin_owners from anon, authenticated;
revoke all on public.admin_audit_logs from anon, authenticated;
revoke all on public.contact_messages from anon, authenticated;
revoke all on public.terminal_files from anon, authenticated;
revoke update (xp, status, email_verified) on public.profiles from authenticated;
grant update (handle, display_name, bio, avatar_url) on public.profiles to authenticated;
