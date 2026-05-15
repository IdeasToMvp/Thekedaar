-- Employers who hired / unlocked a worker from the feed
begin;

create table if not exists public.worker_feed_contacts (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.users(id) on delete cascade,
  worker_id uuid not null references public.users(id) on delete cascade,
  action text not null default 'hire' check (action in ('hire')),
  created_at timestamptz not null default now(),
  constraint worker_feed_contacts_employer_worker_uq unique (employer_id, worker_id)
);

create index if not exists worker_feed_contacts_employer_idx on public.worker_feed_contacts (employer_id);
create index if not exists worker_feed_contacts_worker_idx on public.worker_feed_contacts (worker_id);

alter table if exists public.worker_feed_contacts disable row level security;

commit;
