-- Fix recruiter role + listings for 8872730235 (handles 10-digit vs 91-prefixed phone).
-- Run in Supabase SQL editor if "My listings" is empty for this number.

begin;

-- Prefer canonical WhatsApp format (91 + 10 digits)
update public.users
set phone = '918872730235'
where phone in ('8872730235', '918872730235', '+918872730235')
   or regexp_replace(phone, '\D', '', 'g') in ('8872730235', '918872730235');

-- Ensure user row exists
insert into public.users (phone, name, city, current_mode, subscription_plan)
values ('918872730235', 'Priya Sharma', 'Gurugram', 'recruiter', 'pro')
on conflict (phone) do update
  set name = coalesce(public.users.name, excluded.name),
      city = coalesce(public.users.city, excluded.city),
      current_mode = 'recruiter',
      subscription_plan = coalesce(public.users.subscription_plan, excluded.subscription_plan);

-- Required for can_hire / My listings in the app
insert into public.recruiter_profiles (user_id, business_name, hiring_type, company_name)
select u.id, 'Priya Sharma Household', 'individual', 'Home hiring'
from public.users u
where u.phone = '918872730235'
on conflict (user_id) do update
  set business_name = excluded.business_name,
      hiring_type = excluded.hiring_type,
      company_name = excluded.company_name;

-- Re-seed listings (same set as 007)
delete from public.jobs j
using public.users u
where j.recruiter_id = u.id and u.phone = '918872730235';

insert into public.jobs (
  recruiter_id, title, city, salary, timing, accommodation, urgency, category, description
)
select
  u.id,
  v.title,
  'Gurugram',
  v.salary,
  v.timing,
  v.accommodation,
  v.urgency,
  v.category,
  v.description
from public.users u
cross join (
  values
    ('Live-in maid for family home — Sector 47', 18000, 'Live-in · 6 days off/month', true, 'high', 'Maid',
     '3BHK in Sector 47. Cooking basics helpful. Immediate join preferred.'),
    ('Cook for vegetarian household — Nirvana Country', 22000, 'Breakfast, lunch & dinner', false, 'high', 'Cook',
     'North Indian home food for family of 4. Nirvana Country, Gurugram.'),
    ('Shop helper — convenience store DLF Phase 2', 14000, '10am–8pm · 6 days', false, 'medium', 'Shop helper',
     'Billing, stocking shelves, customer handling. DLF Phase 2.'),
    ('Part-time maid — Sushant Lok Phase 1', 12000, '9am–1pm · Mon–Sat', false, 'medium', 'Maid',
     'Cleaning and utensils only. No cooking.'),
    ('Weekend cook — Golf Course Extension', 15000, 'Sat–Sun + some weekdays', false, 'low', 'Cook',
     'Weekend meals and party prep when needed.'),
    ('Retail shop helper — Sector 29', 16000, 'Full-time', false, 'medium', 'Shop helper',
     'Fashion boutique helper. Good communication in Hindi.'),
    ('Urgent house help — Palam Vihar', 20000, 'Live-in', true, 'high', 'Maid',
     'Family relocating; need reliable help within a week.'),
    ('Kitchen helper — cloud kitchen Udyog Vihar', 17000, 'Evening shift', false, 'medium', 'Cook',
     'Prep and packaging support for delivery kitchen.')
) as v(title, salary, timing, accommodation, urgency, category, description)
where u.phone = '918872730235';

commit;

-- Verify (run separately):
-- select u.phone, u.current_mode, u.subscription_plan,
--        (select count(*) from recruiter_profiles rp where rp.user_id = u.id) as has_recruiter_profile,
--        (select count(*) from jobs j where j.recruiter_id = u.id) as job_count
-- from users u
-- where u.phone like '%8872730235';
