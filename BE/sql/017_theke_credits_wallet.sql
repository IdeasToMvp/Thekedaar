-- Theke Credits wallet (employer prepaid balance, paise)

create table if not exists public.wallets (
  user_id uuid primary key references public.users (id) on delete cascade,
  balance_paise bigint not null default 0 check (balance_paise >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null,
  amount_paise bigint not null,
  balance_after_paise bigint not null check (balance_after_paise >= 0),
  reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint wallet_transactions_type_chk check (
    type in (
      'topup',
      'debit_listing',
      'debit_unlock',
      'debit_urgent',
      'admin_adjust',
      'refund'
    )
  )
);

create unique index if not exists wallet_transactions_reference_uidx
  on public.wallet_transactions (reference)
  where reference is not null;

create index if not exists wallet_transactions_user_created_idx
  on public.wallet_transactions (user_id, created_at desc);

alter table public.jobs
  add column if not exists urgent_paid boolean not null default false;
