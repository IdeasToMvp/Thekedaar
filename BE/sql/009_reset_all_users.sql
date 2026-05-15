-- DANGER: Deletes ALL users and related app data. Use only on dev/staging.
-- After this, everyone must register again via WhatsApp (+ sign-in link on web).
-- Does NOT remove table structure or migrations.

begin;

-- WhatsApp bot state (phone-keyed; not tied to users.id)
delete from public.conversation_states;

-- Feed apply/hire tracking
delete from public.job_feed_contacts;

-- Matches (worker ↔ job)
delete from public.matches;

-- All job posts (including demo seed listings)
delete from public.jobs;

-- Login tokens (also removed when users are deleted, if any remain)
delete from public.magic_link_tokens;

-- Profiles + users (CASCADE removes worker_profiles, recruiter_profiles, etc.)
delete from public.users;

commit;

-- Verify:
-- select count(*) as users from public.users;
-- select count(*) as jobs from public.jobs;
-- select count(*) as conversations from public.conversation_states;
