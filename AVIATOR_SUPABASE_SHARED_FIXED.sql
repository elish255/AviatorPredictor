-- AVIATOR PREDICTOR - FIXED SUPABASE SCHEMA
-- IMPORTANT:
-- The previous aviator_users table already existed with id = bigint.
-- The application uses UUID user IDs, so the old Aviator tables must be
-- recreated. These tables are prefixed with aviator_ and are separate
-- from other projects.

create extension if not exists pgcrypto;

-- Remove ONLY the Aviator tables created for this project.
-- This does not touch tables belonging to your other projects.
drop table if exists public.aviator_payments cascade;
drop table if exists public.aviator_sessions cascade;
drop table if exists public.aviator_users cascade;

create table public.aviator_users (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  current_package integer not null default 1
    check (current_package between 1 and 3),
  last_package integer not null default 0
    check (last_package between 0 and 3),
  site_name text,
  site_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.aviator_sessions (
  token text primary key,
  user_id uuid not null
    references public.aviator_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.aviator_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    references public.aviator_users(id) on delete cascade,
  package_no integer not null
    check (package_no between 1 and 3),
  amount integer not null,
  phone text not null,
  order_id text unique,
  status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index aviator_sessions_user_idx
  on public.aviator_sessions(user_id);

create index aviator_sessions_expires_idx
  on public.aviator_sessions(expires_at);

create index aviator_payments_user_idx
  on public.aviator_payments(user_id);

create index aviator_payments_status_idx
  on public.aviator_payments(status);

alter table public.aviator_users enable row level security;
alter table public.aviator_sessions enable row level security;
alter table public.aviator_payments enable row level security;

-- The Vercel API uses the server-only Supabase service key.
-- No public/anon policies are required for these tables.
