-- TraderKit Phase 1 — Initial Schema

-- Profiles (auto-created on auth.users insert)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles(id, email)
  values (new.id, new.email)
  on conflict(id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Exchanges (encrypted API keys)
create table if not exists exchanges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exchange_name text not null,
  api_key_encrypted text not null,
  api_secret_encrypted text not null,
  is_active boolean default true,
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, exchange_name)
);

-- Trades (normalized, with FIFO P&L)
create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exchange_id uuid not null references exchanges(id) on delete cascade,
  external_id text not null,
  pair text not null,
  base_currency text not null,
  quote_currency text not null,
  side text not null check (side in ('buy', 'sell')),
  amount numeric not null,
  price numeric not null,
  fee numeric not null default 0,
  fee_currency text,
  pnl numeric,
  pnl_currency text,
  opened_at timestamptz not null,
  closed_at timestamptz,
  raw_data jsonb,
  created_at timestamptz default now(),
  unique(exchange_id, external_id)
);

-- Sync logs
create table if not exists sync_logs (
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid not null references exchanges(id) on delete cascade,
  status text not null check (status in ('success', 'error')),
  trades_imported integer default 0,
  error text,
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table exchanges enable row level security;
alter table trades enable row level security;
alter table sync_logs enable row level security;

-- Policies
create policy "users_own_profile" on profiles
  for all using (auth.uid() = id);

create policy "users_own_exchanges" on exchanges
  for all using (auth.uid() = user_id);

create policy "users_own_trades" on trades
  for all using (auth.uid() = user_id);

create policy "users_own_sync_logs" on sync_logs
  for select using (
    exchange_id in (select id from exchanges where user_id = auth.uid())
  );

-- Indexes
create index if not exists trades_user_opened_at on trades(user_id, opened_at desc);
create index if not exists trades_user_pair on trades(user_id, pair);
create index if not exists trades_exchange_id on trades(exchange_id);
