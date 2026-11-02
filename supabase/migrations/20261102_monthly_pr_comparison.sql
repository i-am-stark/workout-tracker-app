create or replace function public.get_monthly_pr_comparison(p_month date)
returns table (
  user_position bigint,
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
