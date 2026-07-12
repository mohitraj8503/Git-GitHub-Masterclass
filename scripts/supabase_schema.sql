-- Create registrations table for Git & GitHub Master Workshop
create table if not exists public.registrations (
  id text primary key,
  name text not null,
  enrollment_number text unique not null,
  email text unique not null,
  google_id text,
  github_id text,
  phone_number text not null,
  branch text not null,
  year_of_study text not null,
  section_class text,
  git_experience text not null,
  has_laptop text not null,
  has_github_account text not null,
  available_all_days text not null,
  joining_reason text,
  registered_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.registrations enable row level security;

-- Drop policies if they exist to prevent setup run conflicts
drop policy if exists "Allow anonymous registrations insert" on public.registrations;
drop policy if exists "Allow authenticated users select" on public.registrations;

-- Create policy to allow public inserts (anonymous registrations)
create policy "Allow anonymous registrations insert"
on public.registrations
for insert
to anon
with check (true);

-- Create policy to allow admin/authenticated users to view registrations
create policy "Allow authenticated users select"
on public.registrations
for select
to authenticated
using (true);
