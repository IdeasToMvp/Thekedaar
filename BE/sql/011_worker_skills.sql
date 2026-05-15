-- Multiple skills per worker (e.g. Maid + Cook). Keeps legacy `role` as primary skill for older clients.

begin;

alter table public.worker_profiles add column if not exists skills text[] not null default '{}';

update public.worker_profiles
set skills = array[role]::text[]
where (skills is null or skills = '{}') and role is not null and trim(role) <> '';

create index if not exists worker_profiles_skills_gin on public.worker_profiles using gin (skills);

commit;
