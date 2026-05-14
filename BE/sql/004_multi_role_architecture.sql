-- Multi-role architecture: identity on users; seeker vs hirer data on separate profiles.
-- Run after 001_init, 002_user_hiring_seeking, 003_subscription_plan (order matters for backfills).

begin;

-- Recruiter / hirer profile (optional; one row per user who hires)
create table if not exists public.recruiter_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  business_name text,
  hiring_type text,
  company_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recruiter_profiles_hiring_type_idx on public.recruiter_profiles (hiring_type);

drop trigger if exists trg_recruiter_profiles_updated_at on public.recruiter_profiles;
create trigger trg_recruiter_profiles_updated_at
before update on public.recruiter_profiles
for each row execute function public.set_updated_at();

-- App UI: which dashboard surface to show (not a permanent "account type")
alter table public.users add column if not exists current_mode text not null default 'worker';

alter table public.users drop constraint if exists users_current_mode_chk;
alter table public.users
  add constraint users_current_mode_chk check (current_mode in ('worker', 'recruiter'));

-- Conversation context (explicit columns + existing metadata jsonb)
alter table public.conversation_states add column if not exists current_flow text not null default 'idle';
alter table public.conversation_states add column if not exists current_mode text;
alter table public.conversation_states add column if not exists last_intent text;

-- Worker seeker role field: rename job_type -> role (job role: cook, maid, …)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'worker_profiles' and column_name = 'job_type'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'worker_profiles' and column_name = 'role'
  ) then
    alter table public.worker_profiles rename column job_type to role;
  end if;
end $$;

drop index if exists public.worker_profiles_job_type_idx;
create index if not exists worker_profiles_role_idx on public.worker_profiles (role);

-- Seed recruiter profiles from legacy hiring flag (before dropping columns)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'hiring_enabled'
  ) then
    insert into public.recruiter_profiles (user_id, hiring_type)
    select u.id, 'individual'
    from public.users u
    where coalesce(u.hiring_enabled, false) = true
    on conflict (user_id) do nothing;
  end if;
end $$;

-- Drop legacy permanent-role / dual-flag model
alter table public.users drop constraint if exists users_hiring_or_seeking;
alter table public.users drop constraint if exists users_role_check;
alter table public.users drop column if exists hiring_enabled;
alter table public.users drop column if exists seeking_enabled;
alter table public.users drop column if exists role;

commit;
