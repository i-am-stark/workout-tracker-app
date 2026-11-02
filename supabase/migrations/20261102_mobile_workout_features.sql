alter table public.workout_days
  add column if not exists workout_type text;

alter table public.workout_entries
  add column if not exists entry_type text not null default 'strength',
  add column if not exists distance_km numeric(8,2),
  add column if not exists speed_kmh numeric(8,2);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.workout_entries'::regclass
      and conname = 'workout_entries_entry_type_check'
  ) then
    alter table public.workout_entries
      add constraint workout_entries_entry_type_check
      check (entry_type in ('strength', 'cardio'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.workout_entries'::regclass
      and conname = 'workout_entries_cardio_metrics_check'
  ) then
    alter table public.workout_entries
      add constraint workout_entries_cardio_metrics_check
      check (
        entry_type = 'strength'
        or (
          entry_type = 'cardio'
          and distance_km is not null and distance_km > 0
          and speed_kmh is not null and speed_kmh > 0
        )
      );
  end if;
end;
$$;

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

drop policy if exists "Users can view own profile" on public.user_profiles;
create policy "Users can view own profile"
on public.user_profiles for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile"
on public.user_profiles for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own profile" on public.user_profiles;
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

drop trigger if exists on_auth_user_created_workout_profile on auth.users;
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
