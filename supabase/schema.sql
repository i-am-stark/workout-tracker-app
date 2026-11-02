create extension if not exists "pgcrypto";

create table if not exists public.workout_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  date date not null,
  status text not null default 'empty' check (status in ('empty', 'workout', 'rest', 'skipped')),
  notes text,
  workout_type text,
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
  entry_type text not null default 'strength' check (entry_type in ('strength', 'cardio')),
  sets integer not null default 0 check (sets >= 0),
  reps integer not null default 0 check (reps >= 0),
  weight numeric(8,2) default 0,
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb', 'bodyweight')),
  set_details jsonb not null default '[]'::jsonb
    check (jsonb_typeof(set_details) = 'array'),
  distance_km numeric(8,2),
  speed_kmh numeric(8,2),
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_entries_cardio_metrics_check
    check (
      entry_type = 'strength'
      or (
        entry_type = 'cardio'
        and distance_km is not null and distance_km > 0
        and speed_kmh is not null and speed_kmh > 0
      )
    )
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

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Athlete'
    check (char_length(btrim(display_name)) between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_profiles_display_name
  on public.user_profiles(display_name);

alter table public.user_profiles enable row level security;

grant select, insert, update on public.user_profiles to authenticated;

create policy "Users can view own profile"
on public.user_profiles for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own profile"
on public.user_profiles for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own profile"
on public.user_profiles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.handle_new_workout_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
begin
  requested_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');

  insert into public.user_profiles (user_id, display_name)
  values (new.id, coalesce(left(requested_name, 40), 'Athlete'))
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_workout_profile() from public, anon, authenticated;

create trigger on_auth_user_created_workout_profile
after insert on auth.users
for each row execute function public.handle_new_workout_profile();

insert into public.user_profiles (user_id, display_name)
select u.id, 'Athlete'
from auth.users as u
where u.is_anonymous = false
on conflict (user_id) do nothing;

create or replace function public.get_monthly_leaderboard(p_month date)
returns table (
  user_position bigint,
  rank_position bigint,
  display_name text,
  workout_days bigint,
  is_current_user boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with month_bounds as (
    select
      date_trunc('month', p_month::timestamp)::date as month_start,
      (date_trunc('month', p_month::timestamp) + interval '1 month')::date as next_month_start
  ),
  counts as (
    select
      profile.user_id,
      profile.display_name,
      count(day_row.id)::bigint as workout_day_count
    from public.user_profiles as profile
    join auth.users as auth_user on auth_user.id = profile.user_id
    cross join month_bounds as bounds
    left join public.workout_days as day_row
      on day_row.user_id = profile.user_id
      and day_row.status = 'workout'
      and day_row.date >= bounds.month_start
      and day_row.date < bounds.next_month_start
    where auth_user.is_anonymous = false
    group by profile.user_id, profile.display_name
  ),
  ranked as (
    select
      counts.user_id,
      counts.display_name,
      counts.workout_day_count,
      rank() over (order by counts.workout_day_count desc) as user_rank
    from counts
  )
  select
    ranked.user_rank,
    ranked.display_name,
    ranked.workout_day_count,
    ranked.user_id = (select auth.uid())
  from ranked
  order by ranked.user_rank, ranked.display_name;
$$;

revoke all on function public.get_monthly_leaderboard(date) from public, anon;
grant execute on function public.get_monthly_leaderboard(date) to authenticated;

create or replace function public.get_monthly_pr_comparison(p_month date)
returns table (
  rank_position bigint,
  display_name text,
  exercise_name text,
  weight_kg numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  with month_bounds as (
    select
      date_trunc('month', p_month::timestamp)::date as month_start,
      (date_trunc('month', p_month::timestamp) + interval '1 month')::date as next_month_start
  ),
  workout_counts as (
    select
      profile.user_id,
      profile.display_name,
      count(day_row.id)::bigint as workout_day_count
    from public.user_profiles as profile
    join auth.users as auth_user on auth_user.id = profile.user_id
    cross join month_bounds as bounds
    left join public.workout_days as day_row
      on day_row.user_id = profile.user_id
      and day_row.status = 'workout'
      and day_row.date >= bounds.month_start
      and day_row.date < bounds.next_month_start
    where auth_user.is_anonymous = false
    group by profile.user_id, profile.display_name
  ),
  ranked_users as (
    select
      workout_counts.user_id,
      workout_counts.display_name,
      rank() over (order by workout_counts.workout_day_count desc) as user_rank,
      workout_counts.workout_day_count
    from workout_counts
  ),
  top_users as (
    select
      ranked_users.user_id,
      ranked_users.display_name,
      ranked_users.user_rank,
      row_number() over (
        order by ranked_users.user_rank, ranked_users.display_name, ranked_users.user_id
      ) as user_position
    from ranked_users
    order by ranked_users.user_rank, ranked_users.display_name, ranked_users.user_id
    limit 5
  ),
  personal_records as (
    select
      entry.user_id,
      min(entry.exercise_name) as exercise_name,
      max(
        entry.weight * case
          when entry.weight_unit = 'lb' then 0.45359237::numeric
          else 1::numeric
        end
      ) as weight_kg
    from public.workout_entries as entry
    join top_users on top_users.user_id = entry.user_id
    where entry.entry_type = 'strength'
      and entry.weight_unit in ('kg', 'lb')
      and entry.weight > 0
    group by entry.user_id, lower(btrim(entry.exercise_name))
  ),
  ranked_records as (
    select
      top_users.user_position,
      top_users.user_rank,
      top_users.display_name,
      personal_records.exercise_name,
      personal_records.weight_kg,
      row_number() over (
        partition by top_users.user_id
        order by personal_records.weight_kg desc nulls last, personal_records.exercise_name
      ) as record_rank
    from top_users
    left join personal_records on personal_records.user_id = top_users.user_id
  )
  select
    ranked_records.user_position,
    ranked_records.user_rank,
    ranked_records.display_name,
    ranked_records.exercise_name,
    ranked_records.weight_kg
  from ranked_records
  where ranked_records.weight_kg is null or ranked_records.record_rank <= 5
  order by ranked_records.user_position, ranked_records.record_rank;
$$;

revoke all on function public.get_monthly_pr_comparison(date) from public, anon;
grant execute on function public.get_monthly_pr_comparison(date) to authenticated;
