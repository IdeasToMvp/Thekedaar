-- Private full address (never shown on public feed)
begin;

alter table public.users add column if not exists full_address text;
alter table public.jobs add column if not exists full_address text;

commit;
