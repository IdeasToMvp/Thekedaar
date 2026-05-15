-- Public location: city + sector/area only (no full address on feed)
-- Apply after 012_age_gender_documents.sql

begin;

alter table public.users
  add column if not exists sector text;

alter table public.jobs
  add column if not exists sector text;

create index if not exists users_sector_idx on public.users (sector) where sector is not null;
create index if not exists jobs_sector_idx on public.jobs (sector) where sector is not null;

commit;
