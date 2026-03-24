create table waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz default now()
);

alter table waitlist enable row level security;

create policy "anyone can join waitlist"
  on waitlist for insert
  with check (true);
