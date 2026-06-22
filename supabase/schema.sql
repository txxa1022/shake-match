-- Supabase schema stub for production (PostGIS proximity search)
-- Run in Supabase SQL Editor when connecting the real backend.

create extension if not exists postgis;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  gender text not null check (gender in ('male', 'female')),
  birth_date date not null,
  photo_url text,
  favorite_food text,
  hobbies text,
  kyc_status text not null default 'pending'
    check (kyc_status in ('pending', 'verified', 'rejected')),
  is_adult_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists user_locations (
  user_id uuid primary key references users(id) on delete cascade,
  location geography(point, 4326) not null,
  updated_at timestamptz not null default now()
);

create index if not exists user_locations_geo_idx
  on user_locations using gist (location);

create table if not exists proximity_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  matched_user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index if not exists proximity_matches_lookup_idx
  on proximity_matches (user_id, matched_user_id, expires_at desc);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references users(id) on delete cascade,
  receiver_id uuid not null references users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists messages_participants_idx
  on messages (sender_id, receiver_id, created_at desc);

create table if not exists blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references users(id) on delete cascade,
  blocked_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references users(id) on delete cascade,
  reported_user_id uuid not null references users(id) on delete cascade,
  reason text not null,
  message_id uuid references messages(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Example proximity query (2km, KYC verified, age 18-35, female only):
-- select u.id, u.nickname, st_distance(ul.location, st_setsrid(st_makepoint(:lng, :lat), 4326)::geography) as distance_m
-- from users u
-- join user_locations ul on ul.user_id = u.id
-- where u.is_adult_verified = true
--   and u.gender = 'female'
--   and date_part('year', age(u.birth_date)) between 18 and 35
--   and st_dwithin(ul.location, st_setsrid(st_makepoint(:lng, :lat), 4326)::geography, 2000)
-- order by distance_m
-- limit 20;
