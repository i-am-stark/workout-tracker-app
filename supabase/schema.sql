create extension if not exists "pgcrypto";

create table if not exists public.workout_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  date date not null,
  status text not null default 'empty' check (status in ('empty', 'workout', 'rest', 'skipped')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  category text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.workout_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  day_id uuid not null references public.workout_days(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  exercise_name text not null,
  sets integer not null default 0 check (sets >= 0),
  reps integer not null default 0 check (reps >= 0),
  weight numeric(8,2) default 0,
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb', 'bodyweight')),
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_workout_days_user_date
  on public.workout_days(user_id, date);

create index if not exists idx_exercises_user_name
  on public.exercises(user_id, name);

create index if not exists idx_workout_entries_day
  on public.workout_entries(day_id);

create index if not exists idx_workout_entries_user
  on public.workout_entries(user_id);

alter table public.workout_days enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_entries enable row level security;

create policy "Users can view own workout days"
on public.workout_days
for select
using (auth.uid() = user_id);

create policy "Users can insert own workout days"
on public.workout_days
for insert
with check (auth.uid() = user_id);

create policy "Users can update own workout days"
on public.workout_days
for update
using (auth.uid() = user_id);

create policy "Users can delete own workout days"
on public.workout_days
for delete
using (auth.uid() = user_id);

create policy "Users can view own exercises"
on public.exercises
for select
using (auth.uid() = user_id);

create policy "Users can insert own exercises"
on public.exercises
for insert
with check (auth.uid() = user_id);

create policy "Users can update own exercises"
on public.exercises
for update
using (auth.uid() = user_id);

create policy "Users can delete own exercises"
on public.exercises
for delete
using (auth.uid() = user_id);

create policy "Users can view own workout entries"
on public.workout_entries
for select
using (auth.uid() = user_id);

create policy "Users can insert own workout entries"
on public.workout_entries
for insert
with check (auth.uid() = user_id);

create policy "Users can update own workout entries"
on public.workout_entries
for update
using (auth.uid() = user_id);

create policy "Users can delete own workout entries"
on public.workout_entries
for delete
using (auth.uid() = user_id);
