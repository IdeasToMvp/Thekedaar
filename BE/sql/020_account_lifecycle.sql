-- Account lifecycle: active | paused | deleted | banned

alter table public.users
  add column if not exists account_status text not null default 'active',
  add column if not exists paused_at timestamptz,
  add column if not exists deleted_at timestamptz;

alter table public.users
  drop constraint if exists users_account_status_chk;

alter table public.users
  add constraint users_account_status_chk check (
    account_status in ('active', 'paused', 'deleted', 'banned')
  );

create index if not exists users_account_status_idx on public.users (account_status);
create index if not exists users_phone_account_status_idx on public.users (phone, account_status);

comment on column public.users.account_status is 'active=normal; paused=hidden; deleted=soft delete; banned=restricted';
comment on column public.users.paused_at is 'When user paused profile/hiring via app';
comment on column public.users.deleted_at is 'When user soft-deleted account';
