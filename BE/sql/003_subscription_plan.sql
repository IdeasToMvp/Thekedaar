-- User subscription tier (for feature gating in app + future billing).
-- Apply in Supabase SQL editor after prior migrations.

begin;

alter table public.users
  add column if not exists subscription_plan text not null default 'free';

alter table public.users
  drop constraint if exists users_subscription_plan_chk;

alter table public.users
  add constraint users_subscription_plan_chk
  check (subscription_plan in ('free', 'basic', 'pro'));

commit;
