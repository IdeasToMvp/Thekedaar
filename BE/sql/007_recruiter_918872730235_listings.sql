-- Recruiter hiring listings for +91 8872730235 (stored as 918872730235).
-- Apply after 006_gurugram_launch_jobs.sql.

begin;

insert into public.users (phone, name, city, current_mode, subscription_plan)
values ('918872730235', 'Priya Sharma', 'Gurugram', 'recruiter', 'pro')
on conflict (phone) do update
  set name = excluded.name,
      city = excluded.city,
      current_mode = excluded.current_mode,
      subscription_plan = excluded.subscription_plan;

insert into public.recruiter_profiles (user_id, business_name, hiring_type, company_name)
select u.id, 'Priya Sharma Household', 'individual', 'Home hiring'
from public.users u
where u.phone = '918872730235'
on conflict (user_id) do update
  set business_name = excluded.business_name,
      hiring_type = excluded.hiring_type,
      company_name = excluded.company_name;

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
