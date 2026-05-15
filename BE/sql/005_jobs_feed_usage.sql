-- Feed job columns, contact tracking, and 100 demo job rows in the database.
-- Apply after 004_multi_role_architecture.sql.

begin;

alter table public.jobs add column if not exists category text;
alter table public.jobs add column if not exists description text;

create table if not exists public.job_feed_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  action text not null check (action in ('apply', 'whatsapp', 'hire')),
  created_at timestamptz not null default now(),
  constraint job_feed_contacts_user_job_uq unique (user_id, job_id)
);

create index if not exists job_feed_contacts_user_idx on public.job_feed_contacts (user_id);
create index if not exists job_feed_contacts_job_idx on public.job_feed_contacts (job_id);

insert into public.users (phone, name, city, current_mode, subscription_plan)
values ('919999000001', 'Demo Listings', 'Mumbai', 'recruiter', 'pro')
on conflict (phone) do update
  set name = excluded.name,
      city = excluded.city,
      current_mode = excluded.current_mode,
      subscription_plan = excluded.subscription_plan;

insert into public.recruiter_profiles (user_id, business_name, hiring_type, company_name)
select u.id, 'Demo Listings', 'demo_seed', 'Thekedaar seed'
from public.users u
where u.phone = '919999000001'
on conflict (user_id) do update
  set business_name = excluded.business_name,
      hiring_type = excluded.hiring_type,
      company_name = excluded.company_name;

delete from public.jobs j
using public.users u
where j.recruiter_id = u.id and u.phone = '919999000001';

insert into public.jobs (
  recruiter_id, title, city, salary, timing, accommodation, urgency, category, description
)
select
  u.id,
  case (g.n % 8)
    when 0 then 'Full-time house help'
    when 1 then 'North Indian cook'
    when 2 then 'Personal driver (SUV)'
    when 3 then 'Night shift guard'
    when 4 then 'Infant care + light chores'
    when 5 then 'Peon + filing'
    when 6 then 'Lawn + plants maintenance'
    else 'Helper for shifting'
  end
    || ' #' || lpad(g.n::text, 3, '0'),
  (array['Delhi NCR', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad'])[1 + ((g.n * 3) % 8)],
  8000 + ((g.n * 173) % 42000),
  'Flexible / demo',
  (g.n % 2 = 0),
  case (g.n % 3) when 0 then 'low' when 1 then 'medium' else 'high' end,
  (array['Maid', 'Cook', 'Driver', 'Security guard', 'Nanny', 'Office help', 'Gardener', 'Helper'])[1 + (g.n % 8)],
  'Demo job listing in ' ||
  (array['Delhi NCR', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad'])[1 + ((g.n * 3) % 8)] ||
  '. Posted for Thekedaar feed (ref #' || g.n || ').'
from public.users u
cross join generate_series(1, 100) as g(n)
where u.phone = '919999000001';

commit;
