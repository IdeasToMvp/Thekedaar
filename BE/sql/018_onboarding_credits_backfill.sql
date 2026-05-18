-- One-time: grant ₹100 welcome credits to existing recruiters who never received onboarding bonus.
-- Safe to re-run: skips users who already have reference onboarding:<user_id>.

insert into public.wallets (user_id, balance_paise)
select rp.user_id, 0
from public.recruiter_profiles rp
on conflict (user_id) do nothing;

insert into public.wallet_transactions (user_id, type, amount_paise, balance_after_paise, reference, metadata)
select
  rp.user_id,
  'topup',
  10000,
  coalesce(w.balance_paise, 0) + 10000,
  'onboarding:' || rp.user_id::text,
  '{"reason":"onboarding_bonus","amountInr":100}'::jsonb
from public.recruiter_profiles rp
join public.wallets w on w.user_id = rp.user_id
where not exists (
  select 1 from public.wallet_transactions t
  where t.reference = 'onboarding:' || rp.user_id::text
);

update public.wallets w
set balance_paise = sub.new_balance,
    updated_at = now()
from (
  select user_id, balance_after_paise as new_balance
  from public.wallet_transactions
  where reference like 'onboarding:%'
) sub
where w.user_id = sub.user_id;
