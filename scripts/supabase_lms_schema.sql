-- 1. Profiles (Student Meta Details)
create table if not exists public.profiles (
  id text primary key references public.registrations(id) on delete cascade,
  avatar_url text,
  bio text,
  github_username text,
  linkedin_url text,
  resume_url text,
  skills text[] default '{}'::text[],
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Announcements
create table if not exists public.announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  type text default 'general' not null, -- 'general', 'schedule', 'assignment', 'reminder'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Resources (PPTs, Notes, Videos)
create table if not exists public.resources (
  id uuid default gen_random_uuid() primary key,
  session_number integer not null,
  title text not null,
  file_url text not null,
  type text not null, -- 'ppt', 'pdf', 'video', 'link'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Assignments
create table if not exists public.assignments (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  due_date timestamp with time zone not null,
  max_marks integer default 10 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Submissions (Student Homework)
create table if not exists public.submissions (
  id uuid default gen_random_uuid() primary key,
  assignment_id uuid references public.assignments(id) on delete cascade,
  student_id text references public.registrations(id) on delete cascade,
  repo_url text not null,
  live_url text,
  marks_obtained integer,
  mentor_feedback text,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (assignment_id, student_id)
);

-- 6. Attendance Logs
create table if not exists public.attendance (
  id uuid default gen_random_uuid() primary key,
  student_id text references public.registrations(id) on delete cascade,
  session_day integer not null, -- 1 through 7
  verified_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (student_id, session_day)
);

-- 7. XP Logs (Gamification tracking)
create table if not exists public.xp_logs (
  id uuid default gen_random_uuid() primary key,
  student_id text references public.registrations(id) on delete cascade,
  amount integer not null,
  reason text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on all new tables
alter table public.profiles enable row level security;
alter table public.announcements enable row level security;
alter table public.resources enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.attendance enable row level security;
alter table public.xp_logs enable row level security;

-- Drop policies if they exist to prevent setup run conflicts
drop policy if exists "Allow profile read for all" on public.profiles;
drop policy if exists "Allow profile update for owners" on public.profiles;
drop policy if exists "Allow profile insert for owners" on public.profiles;
drop policy if exists "Allow announcement read for all" on public.announcements;
drop policy if exists "Allow resource read for all" on public.resources;
drop policy if exists "Allow assignments read for all" on public.assignments;
drop policy if exists "Allow student select submissions" on public.submissions;
drop policy if exists "Allow student insert submissions" on public.submissions;
drop policy if exists "Allow student update submissions" on public.submissions;
drop policy if exists "Allow attendance read for owners" on public.attendance;
drop policy if exists "Allow attendance insert for owners" on public.attendance;
drop policy if exists "Allow xp_logs read for owners" on public.xp_logs;

-- Profiles policies
create policy "Allow profile read for all" on public.profiles for select to anon, authenticated using (true);
create policy "Allow profile update for owners" on public.profiles for update to anon using (true);
create policy "Allow profile insert for owners" on public.profiles for insert to anon with check (true);

-- Announcements policies
create policy "Allow announcement read for all" on public.announcements for select to anon, authenticated using (true);

-- Resources policies
create policy "Allow resource read for all" on public.resources for select to anon, authenticated using (true);

-- Assignments policies
create policy "Allow assignments read for all" on public.assignments for select to anon, authenticated using (true);

-- Submissions policies
create policy "Allow student select submissions" on public.submissions for select to anon using (true);
create policy "Allow student insert submissions" on public.submissions for insert to anon with check (true);
create policy "Allow student update submissions" on public.submissions for update to anon using (true);

-- Attendance policies
create policy "Allow attendance read for owners" on public.attendance for select to anon using (true);
create policy "Allow attendance insert for owners" on public.attendance for insert to anon with check (true);

-- XP Logs policies
create policy "Allow xp_logs read for owners" on public.xp_logs for select to anon using (true);
