-- Job applications (worker apply → employer approve) + experience on listings
begin;

alter table public.jobs add column if not exists experience_years_required int;

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  worker_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_applications_worker_job_uq unique (worker_id, job_id)
);

create index if not exists job_applications_job_idx on public.job_applications (job_id);
create index if not exists job_applications_worker_idx on public.job_applications (worker_id);
create index if not exists job_applications_status_idx on public.job_applications (status);

alter table if exists public.job_applications disable row level security;

commit;
