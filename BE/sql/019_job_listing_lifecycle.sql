-- Job listing lifecycle: edits, close, hire tracking

alter table public.jobs
  add column if not exists listing_status text not null default 'open';

alter table public.jobs
  drop constraint if exists jobs_listing_status_chk;

alter table public.jobs
  add constraint jobs_listing_status_chk
  check (listing_status in ('open', 'closed'));

alter table public.jobs
  add column if not exists edit_count int not null default 0;

alter table public.jobs
  add column if not exists edited_at timestamptz;

alter table public.jobs
  add column if not exists closed_at timestamptz;

alter table public.jobs
  add column if not exists hired_worker_id uuid references public.users (id) on delete set null;

alter table public.jobs
  add column if not exists hire_source text;

alter table public.jobs
  drop constraint if exists jobs_hire_source_chk;

alter table public.jobs
  add constraint jobs_hire_source_chk
  check (
    hire_source is null
    or hire_source in ('not_hired', 'platform_worker', 'off_platform')
  );

alter table public.jobs
  add column if not exists hired_worker_name text;

create index if not exists jobs_listing_status_idx on public.jobs (listing_status);
create index if not exists jobs_recruiter_status_idx on public.jobs (recruiter_id, listing_status);
