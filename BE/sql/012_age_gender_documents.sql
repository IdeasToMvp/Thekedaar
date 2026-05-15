-- Age, gender, and document requirements (Aadhaar v1)
-- Apply in Supabase SQL editor after 011_worker_skills.sql

begin;

alter table public.worker_profiles
  add column if not exists age int check (age is null or (age >= 16 and age <= 80)),
  add column if not exists gender text check (
    gender is null or gender in ('male', 'female', 'other', 'prefer_not_to_say')
  ),
  add column if not exists has_aadhaar boolean;

alter table public.jobs
  add column if not exists min_age int check (min_age is null or (min_age >= 16 and min_age <= 80)),
  add column if not exists max_age int check (max_age is null or (max_age >= 16 and max_age <= 80)),
  add column if not exists preferred_gender text check (
    preferred_gender is null or preferred_gender in ('any', 'male', 'female')
  ),
  add column if not exists required_documents text[] not null default '{}'::text[];

commit;
