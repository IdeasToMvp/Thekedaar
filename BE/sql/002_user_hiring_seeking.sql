-- Dual mode: same person can hire and seek work.
-- Run in Supabase SQL editor after 001_init.sql.

begin;

alter table public.users
  add column if not exists hiring_enabled boolean not null default false;

alter table public.users
  add column if not exists seeking_enabled boolean not null default false;

-- Backfill from legacy role column
update public.users
set
  hiring_enabled = (role = 'recruiter'),
  seeking_enabled = (role = 'worker')
where true;

-- At least one mode must stay on (matches app validation)
alter table public.users
  drop constraint if exists users_hiring_or_seeking;

alter table public.users
  add constraint users_hiring_or_seeking check (hiring_enabled or seeking_enabled);

commit;
