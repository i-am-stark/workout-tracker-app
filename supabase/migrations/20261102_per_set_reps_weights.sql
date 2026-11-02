alter table public.workout_entries
  add column if not exists set_details jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.workout_entries'::regclass
      and conname = 'workout_entries_set_details_array_check'
  ) then
    alter table public.workout_entries
      add constraint workout_entries_set_details_array_check
      check (jsonb_typeof(set_details) = 'array');
  end if;
end;
$$;
