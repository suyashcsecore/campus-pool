-- CampusPool database schema for Supabase
-- Run this in Supabase Dashboard → SQL Editor

create table if not exists users (
  id text primary key,
  email text unique not null,
  password_hash text not null,
  name text not null,
  phone text not null,
  trust_score int default 100,
  completed_rides_count int default 0,
  no_shows_count int default 0,
  joined_at timestamptz default now()
);

create table if not exists rides (
  id text primary key,
  creator_id text references users(id) on delete cascade,
  creator_name text not null,
  creator_trust_score int not null,
  source text not null,
  destination text not null,
  departure_time timestamptz not null,
  max_pool_size int not null,
  estimated_fare int not null,
  status text check (status in ('active', 'completed', 'cancelled')) default 'active',
  description text default '',
  created_at timestamptz default now()
);

create table if not exists participants (
  id text primary key,
  ride_id text references rides(id) on delete cascade,
  user_id text references users(id) on delete cascade,
  user_name text not null,
  user_email text not null,
  user_phone text not null,
  user_trust_score int not null,
  status text check (status in ('joined', 'arrived', 'noshow', 'completed')) default 'joined',
  reported_by text[] default '{}',
  joined_at timestamptz default now(),
  unique(ride_id, user_id)
);

create table if not exists messages (
  id text primary key,
  ride_id text references rides(id) on delete cascade,
  user_id text references users(id) on delete cascade,
  user_name text not null,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists idx_rides_status on rides(status);
create index if not exists idx_rides_departure on rides(departure_time);
create index if not exists idx_participants_ride on participants(ride_id);
create index if not exists idx_messages_ride on messages(ride_id);
create index if not exists idx_messages_created on messages(created_at);

-- Enable Realtime
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table rides;

-- Row Level Security (writes go through Next.js API with service role key)
alter table users enable row level security;
alter table rides enable row level security;
alter table participants enable row level security;
alter table messages enable row level security;

-- Read-only policies for browser Realtime subscriptions (anon key)
create policy "anon_read_messages" on messages for select to anon using (true);
create policy "anon_read_participants" on participants for select to anon using (true);
create policy "anon_read_rides" on rides for select to anon using (true);

-- Service role bypasses RLS for all writes (used in API routes)
