-- AVIATOR PREDICTOR: tables are prefixed to avoid collisions with your other projects.
create extension if not exists pgcrypto;

create table if not exists public.aviator_users (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  current_package integer not null default 1 check (current_package between 1 and 3),
  last_package integer not null default 0 check (last_package between 0 and 3),
  site_name text,
  site_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.aviator_sessions (
  token text primary key,
  user_id uuid not null references public.aviator_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.aviator_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.aviator_users(id) on delete cascade,
  package_no integer not null check (package_no between 1 and 3),
  amount integer not null,
  phone text not null,
  order_id text unique,
  status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists aviator_sessions_user_idx on public.aviator_sessions(user_id);
create index if not exists aviator_sessions_expires_idx on public.aviator_sessions(expires_at);
create index if not exists aviator_payments_user_idx on public.aviator_payments(user_id);
create index if not exists aviator_payments_status_idx on public.aviator_payments(status);

alter table public.aviator_users enable row level security;
alter table public.aviator_sessions enable row level security;
alter table public.aviator_payments enable row level security;

-- The API uses the server-only service key. No public policies are required.
-- Do not add anon policies that expose payment rows.
