-- TraderKit Migration 002 — Transfers table
-- Stores deposits and withdrawals from exchanges.
-- These are NOT trades — they represent capital moving in/out of accounts.
-- Kept separate from trades so P&L calculations don't treat them as sell/buy events.
-- The cost basis engine can use these to track adjusted cost basis across exchange transfers.

create table if not exists transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exchange_id uuid not null references exchanges(id) on delete cascade,
  external_id text not null,
  currency text not null,
  amount numeric not null,
  type text not null check (type in ('deposit', 'withdrawal')),
  status text not null,
  tx_hash text,
  address text,
  occurred_at timestamptz not null,
  raw_data jsonb,
  created_at timestamptz default now(),
  unique(exchange_id, external_id)
);

alter table transfers enable row level security;

create policy "users_own_transfers" on transfers
  for all using (auth.uid() = user_id);

create index if not exists transfers_user_occurred_at on transfers(user_id, occurred_at desc);
create index if not exists transfers_exchange_id on transfers(exchange_id);
