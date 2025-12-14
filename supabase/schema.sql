-- Enable UUID generation (Supabase has pgcrypto enabled by default, keep if present)
create extension if not exists "pgcrypto";

-- Profiles (optional metadata)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Forecast runs per user/market
create table if not exists public.forecast_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  market_id text not null,
  market_title text,
  timestamp timestamptz not null,
  market_prob double precision,
  model_prob double precision not null,
  delta double precision not null,
  confidence text not null,
  confidence_score integer,
  signal double precision,
  summary text,
  tags text[] default '{}',
  created_at timestamptz default now()
);
create index if not exists forecast_runs_user_id_idx on public.forecast_runs(user_id);
create index if not exists forecast_runs_market_id_idx on public.forecast_runs(market_id);

-- Watchlist entries
create table if not exists public.watchlist (
  user_id uuid references auth.users on delete cascade,
  market_id text not null,
  created_at timestamptz default now(),
  primary key (user_id, market_id)
);

-- Entitlements/usage
create table if not exists public.entitlements (
  user_id uuid primary key references auth.users on delete cascade,
  plan text default 'Free',
  forecasts_used_today integer default 0,
  forecasts_limit integer default 5,
  evidence_runs_used_today integer default 0,
  evidence_runs_limit integer default 3,
  exports_enabled boolean default false,
  alerts_enabled boolean default false,
  updated_at timestamptz default now()
);

-- Row level security
alter table public.profiles enable row level security;
alter table public.forecast_runs enable row level security;
alter table public.watchlist enable row level security;
alter table public.entitlements enable row level security;

-- Policies: each user only sees/updates their rows
create policy "Users can manage their profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their forecasts" on public.forecast_runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their watchlist" on public.watchlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their entitlements" on public.entitlements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Optional: seed entitlements defaults for a user (replace {{user_id}})
-- insert into public.entitlements (user_id) values ('{{user_id}}') on conflict (user_id) do nothing;
