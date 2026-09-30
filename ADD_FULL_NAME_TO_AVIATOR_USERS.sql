-- AVIATOR PREDICTOR: add Full Name without deleting existing users/data.
-- Run this once in Supabase SQL Editor.

alter table public.aviator_users
  add column if not exists full_name text;

-- Existing accounts remain valid. New registrations require a full name.
-- Optionally fill names for old accounts before making the column NOT NULL.
