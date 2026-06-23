-- Neon (PostgreSQL + PostGIS) schema for Shake Match
-- Run in Neon SQL Editor (or psql) after enabling PostGIS on your project.

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

-- 近接ユーザー検索 (PostGIS st_dwithin)
create or replace function find_nearby_users(
  p_lat double precision,
  p_lng double precision,
  p_max_distance_meters integer default 2000,
  p_age_min integer default 18,
  p_age_max integer default 99,
  p_gender text default 'any',
  p_exclude_user_id uuid default null,
  p_limit integer default 20
)
returns table (
  id uuid,
  nickname text,
  gender text,
  birth_date date,
  photo_url text,
  favorite_food text,
  hobbies text,
  distance_meters double precision
)
language sql
stable
as $$
  select
    u.id,
    u.nickname,
    u.gender,
    u.birth_date,
    u.photo_url,
    u.favorite_food,
    u.hobbies,
    st_distance(
      ul.location,
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
    ) as distance_meters
  from users u
  inner join user_locations ul on ul.user_id = u.id
  where u.is_adult_verified = true
    and (p_exclude_user_id is null or u.id <> p_exclude_user_id)
    and extract(year from age(u.birth_date))::integer >= p_age_min
    and extract(year from age(u.birth_date))::integer <= p_age_max
    and (p_gender = 'any' or u.gender = p_gender)
    and st_dwithin(
      ul.location,
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
      p_max_distance_meters
    )
  order by distance_meters
  limit p_limit;
$$;

-- シェイク時の位置スナップショット（直近1件のみ保持）
create or replace function upsert_user_location(
  p_user_id uuid,
  p_lat double precision,
  p_lng double precision
)
returns void
language sql
as $$
  insert into user_locations (user_id, location, updated_at)
  values (
    p_user_id,
    st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
    now()
  )
  on conflict (user_id) do update set
    location = excluded.location,
    updated_at = now();
$$;
