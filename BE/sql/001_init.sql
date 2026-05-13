-- Thekedaar (Supabase Postgres) - initial schema
-- Apply this in Supabase SQL editor (or as a migration in your workflow).

begin;

-- UUID generation
create extension if not exists "pgcrypto";

-- Updated-at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- USERS
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  role text not null check (role in ('worker', 'recruiter')),
  name text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists users_phone_uq on public.users (phone);
create index if not exists users_role_idx on public.users (role);
create index if not exists users_city_idx on public.users (city);

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- WORKER PROFILES (1:1 with users)
create table if not exists public.worker_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  job_type text,
  experience_years int,
  expected_salary int,
  availability text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists worker_profiles_job_type_idx on public.worker_profiles (job_type);
create index if not exists worker_profiles_expected_salary_idx on public.worker_profiles (expected_salary);

drop trigger if exists trg_worker_profiles_updated_at on public.worker_profiles;
create trigger trg_worker_profiles_updated_at
before update on public.worker_profiles
for each row execute function public.set_updated_at();

-- JOBS
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  city text,
  salary int,
  timing text,
  accommodation boolean,
  urgency text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_recruiter_id_idx on public.jobs (recruiter_id);
create index if not exists jobs_city_idx on public.jobs (city);
create index if not exists jobs_title_idx on public.jobs (title);

drop trigger if exists trg_jobs_updated_at on public.jobs;
create trigger trg_jobs_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

-- MATCHES
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  status text not null default 'new' check (status in ('new', 'sent', 'accepted', 'rejected', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_worker_job_uq unique (worker_id, job_id)
);

create index if not exists matches_worker_id_idx on public.matches (worker_id);
create index if not exists matches_job_id_idx on public.matches (job_id);
create index if not exists matches_status_idx on public.matches (status);

drop trigger if exists trg_matches_updated_at on public.matches;
create trigger trg_matches_updated_at
before update on public.matches
for each row execute function public.set_updated_at();

-- CONVERSATION STATES (keyed by phone)
create table if not exists public.conversation_states (
  phone text primary key,
  current_step text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversation_states_step_idx on public.conversation_states (current_step);
create index if not exists conversation_states_updated_at_idx on public.conversation_states (updated_at desc);

drop trigger if exists trg_conversation_states_updated_at on public.conversation_states;
create trigger trg_conversation_states_updated_at
before update on public.conversation_states
for each row execute function public.set_updated_at();

-- MAGIC LINK TOKENS (one-time)
create table if not exists public.magic_link_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists magic_link_tokens_hash_uq on public.magic_link_tokens (token_hash);
create index if not exists magic_link_tokens_user_id_idx on public.magic_link_tokens (user_id);
create index if not exists magic_link_tokens_expires_at_idx on public.magic_link_tokens (expires_at);

commit;

