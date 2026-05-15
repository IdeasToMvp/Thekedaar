-- Thekedaar BE talks to Postgres only via Supabase service_role (see supabase.service.ts).
-- If RLS was enabled in the Supabase dashboard without policies, inserts fail with 42501.
-- This migration turns RLS off on server-managed tables (no direct browser → Supabase access).

begin;

alter table if exists public.users disable row level security;
alter table if exists public.worker_profiles disable row level security;
alter table if exists public.recruiter_profiles disable row level security;
alter table if exists public.jobs disable row level security;
alter table if exists public.matches disable row level security;
alter table if exists public.conversation_states disable row level security;
alter table if exists public.magic_link_tokens disable row level security;
alter table if exists public.job_feed_contacts disable row level security;

commit;
