-- Replace demo feed listings with 20 Gurugram launch jobs (maid, cook, shop helper).
-- Apply after 005_jobs_feed_usage.sql.

begin;

update public.users
set name = 'Gurugram Listings',
    city = 'Gurugram'
where phone = '919999000001';

delete from public.job_feed_contacts c
using public.jobs j, public.users u
where c.job_id = j.id
  and j.recruiter_id = u.id
  and u.phone = '919999000001';

delete from public.jobs j
using public.users u
where j.recruiter_id = u.id
  and u.phone = '919999000001';

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
    ('Full-time maid — Sector 56', 12000, 'Live-in · 6 days', true, 'high', 'Maid',
     'House help for 3BHK in Sector 56, Gurugram. Cooking not required. Start this week.'),
    ('Morning maid — DLF Phase 1', 14000, '8am–2pm · Mon–Sat', false, 'medium', 'Maid',
     'Daily cleaning and utensils. DLF Phase 1, Gurugram. Prior apartment experience preferred.'),
    ('Maid + light cooking — South City 1', 18000, 'Full-time · live-out', false, 'medium', 'Maid',
     'Cleaning plus basic breakfast/lunch help. South City 1, Gurugram.'),
    ('Weekend maid — Palam Vihar', 10000, 'Sat–Sun only', false, 'low', 'Maid',
     'Deep cleaning weekends. Palam Vihar, Gurugram.'),
    ('Urgent maid — Sushant Lok', 22000, 'Live-in', true, 'high', 'Maid',
     'Immediate join for family of four. Sushant Lok, Gurugram.'),

    ('Home cook — North Indian', 16000, 'Lunch & dinner', false, 'high', 'Cook',
     'Pure veg North Indian meals for family of 5. Sector 45, Gurugram.'),
    ('Part-time cook — MG Road', 13000, 'Dinner only · 5 days', false, 'medium', 'Cook',
     'Evening dinner cook near MG Road, Gurugram. 4–6 people.'),
    ('Live-in cook — Golf Course Road', 28000, 'All meals', true, 'high', 'Cook',
     'Experienced cook for live-in role. Golf Course Road, Gurugram.'),
    ('South Indian cook — Sector 14', 20000, 'Breakfast & lunch', false, 'medium', 'Cook',
     'Idli, dosa, sambar for working couple. Sector 14, Gurugram.'),
    ('Cook for PG — Udyog Vihar', 15000, 'Bulk meals · 25 people', false, 'low', 'Cook',
     'PG kitchen cook. Udyog Vihar, Gurugram. Prior bulk cooking helpful.'),
    ('Tandoor cook — Old Gurgaon', 32000, 'Restaurant shift', false, 'medium', 'Cook',
     'Tandoor specialist for cloud kitchen. Old Gurgaon.'),

    ('Shop helper — Sector 29 market', 12000, '10am–8pm', false, 'medium', 'Shop helper',
     'Retail shop helper, billing and stocking. Sector 29, Gurugram.'),
    ('Store helper — Sadar Bazaar', 14000, 'Full-time', false, 'high', 'Shop helper',
     'General store helper. Sadar Bazaar area, Gurugram. Hindi required.'),
    ('Shop floor helper — Cyber Hub', 18000, 'Rotational shift', false, 'medium', 'Shop helper',
     'Café supply shop floor helper near Cyber Hub, Gurugram.'),
    ('Warehouse shop helper — Manesar', 16000, 'Day shift', false, 'low', 'Shop helper',
     'Packing and loading for Gurugram warehouse (Manesar side).'),
    ('Kirana helper — Sector 10', 11000, 'Morning shift', false, 'low', 'Shop helper',
     'Kirana store helper. Sector 10, Gurugram. Trustworthy and punctual.'),
    ('Mall kiosk helper — Ambience Mall', 22000, 'Mall hours', false, 'medium', 'Shop helper',
     'Sales helper for kiosk. Ambience Mall, Gurugram. Good communication.'),

    ('Maid — Sector 57 (negotiable)', 25000, 'Live-in', true, 'high', 'Maid',
     'Senior house help with childcare experience. Sector 57, Gurugram.'),
    ('Shop helper — DLF Cyber City', 26000, 'Full-time + incentive', false, 'high', 'Shop helper',
     'Electronics shop helper with basic English. DLF Cyber City, Gurugram.'),
    ('Cook — dual cuisine', 30000, 'Live-in · all meals', true, 'high', 'Cook',
     'North + basic Chinese for executive apartment. Gurugram.')
) as v(title, salary, timing, accommodation, urgency, category, description)
where u.phone = '919999000001';

commit;
