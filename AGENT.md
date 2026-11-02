# AGENT.md — Workout Tracker implementation instructions

> **Goal:** Implement the mobile-first workout tracker described below in the existing React + Vite + Supabase application. These instructions are deliberately explicit so a coding agent with a small context/token budget can follow them without redesigning the project.
>
> **Work branch:** `chore/documentation` only. Do not switch branches, merge, rebase, cherry-pick, push, or commit unless the repository owner explicitly asks. Do not change any other branch.

---

## 0. Mandatory rules before changing code

1. Run `git branch --show-current`. It **must** print `chore/documentation`. If it prints anything else, stop without changing files. Do not run `git checkout` to fix it; the owner controls branch selection.
2. Run `git status --short`. Preserve any existing user changes. Never reset, clean, discard, overwrite, or reformat unrelated files.
3. Read this file, then inspect only the source files listed in the repository map below when a task needs them. `PROJECT_GUIDE.md` is also a useful map of the current implementation.
4. Do not read, print, copy, commit, or change `.env`, credentials, Supabase keys, or other secrets. Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` belong in the browser build. **Never** put a Supabase service-role/secret key in frontend code, a migration, or this file.
5. Keep the existing stack: React 18, Vite 5, `@supabase/supabase-js`, plain CSS, and the existing components. Do not add a UI framework, router, state library, calendar library, chart library, icon library, or other dependency for this work.
6. Do not rewrite authentication. Guest sessions, email linking, verification, password setup, password reset, and existing workout ownership must continue to work.
7. Make additive database changes. Do not drop or rename existing columns/tables, change existing user IDs, delete workout history, or weaken existing Row Level Security (RLS).
8. Keep the UI simple. No routine builder, workout templates, social feed, comments, likes, messaging, achievements, or complex periodisation features.
9. Implement in the order in section 2. After each phase, run `npm run build`. Fix errors before moving on.
10. Do not add a new npm dependency unless there is no reasonable way to use the existing stack. There is a working `package-lock.json`; do not update it unnecessarily.
11. Use local date keys (`YYYY-MM-DD`) for workout dates. Do not use `new Date().toISOString().slice(0, 10)` for a local calendar day because UTC conversion can shift the date.
12. The requested file is an implementation specification, not permission to deploy. Do not alter `.github/workflows/deploy.yml` just to make this branch deploy. The current workflow deploys `main` and can be manually run; keep deployment behavior unchanged.

## 1. What is in the repository today

This is an existing working application, not a blank project.

### Stack and current files

- `src/App.jsx`: page/controller. Owns Supabase auth, month selection, loaded workout days/entries, derived metrics, event handlers, and page section order.
- `src/lib/supabase.js`: creates the browser Supabase client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- `src/lib/dateUtils.js`: local `YYYY-MM-DD` keys, 42-cell calendar generation, month title, and date labels.
- `src/api/workoutDays.js`: load and upsert `workout_days` rows.
- `src/api/workoutEntries.js`: load, save, aggregate, and delete `workout_entries` rows.
- `src/api/exercises.js`: current user's saved exercise names and exercise search/upsert.
- `src/components/AccountPanel.jsx`: login, guest sign-in, guest-to-email linking, verification/password setup, and password recovery forms.
- `src/components/CalendarGrid.jsx`: current large calendar grid.
- `src/components/DayDetailsModal.jsx`: day status/notes and add/edit/delete exercise entries.
- `src/components/ExerciseSearch.jsx`: current user-exercise search UI.
- `src/components/WeeklySummary.jsx`: the existing seven-day chart for workout status and sets.
- `src/components/ExerciseChart.jsx`: all-time exercise-focus bar chart; this is **not** the seven-day chart.
- `src/components/SummaryCards.jsx`: monthly metric cards.
- `src/components/HistoryList.jsx`: recent entries.
- `src/index.css`: all styling and responsive breakpoints.
- `supabase/schema.sql`: current three-table schema and own-user RLS policies.
- `README.md` and `PROJECT_GUIDE.md`: setup and architecture documentation; update them after implementation.

### Existing database contract

`public.workout_days` currently has one row per user/date, status (`empty`, `workout`, `rest`, `skipped`), notes, timestamps, and unique `(user_id, date)`.

`public.exercises` currently stores reusable exercise names per user, with unique `(user_id, name)`.

`public.workout_entries` currently stores one exercise row with `exercise_name`, `sets`, `reps`, `weight`, `weight_unit` (`kg`, `lb`, `bodyweight`), notes, sort order, `user_id`, and `day_id`.

All three tables have RLS and existing policies scope normal CRUD to `auth.uid() = user_id`. Preserve these policies. The app accesses Supabase directly from the browser; there is no backend server.

### Existing issues this feature work must address

- At `max-width: 768px`, the current calendar switches to **two columns**. Replace that behavior with a compact seven-column mobile month calendar.
- The current weekly summary calculates the seven dates ending today but uses the currently displayed month's map/entries. It can show incorrect/missing data when the week crosses a month boundary or when an older month is selected. Load the actual seven-day period separately.
- The current dashboard displays summary/insight panels before the calendar. Reorder the authenticated dashboard to put the “Log today's workout” action first, the compact month calendar second, the current-week chart next, and the monthly leaderboard after that.
- `workout_days` has no workout/session category, `workout_entries` has no cardio metrics, and the schema has no profile or leaderboard data yet.
- New workout entries currently have a single exercise name plus numeric sets/reps/weight fields. Extend this simple form; do not turn it into a complicated workout-plan system.

## 2. Implementation order — follow this sequence

### Phase A — database and data APIs

1. Add the additive Supabase migration in section 4.
2. Keep `supabase/schema.sql` as a complete fresh-install schema: append/update it so a new project receives all new columns, profile table, triggers, policies, and RPC function. The migration must also work on the existing database. Do not tell an existing user to rerun the old schema blindly.
3. Add API functions for profile read/save and monthly leaderboard retrieval. Keep direct Supabase queries in `src/api/`, not inside presentational components.
4. Extend existing workout-day and workout-entry APIs for the added fields. Preserve existing behavior for old rows.
5. Add the static exercise library in `src/data/exerciseLibrary.js` using the starter list in section 8. Do not call a third-party API on every search.

### Phase B — workout logging

1. Add a prominent **Log today's workout** button as the first dashboard section after authentication. It opens the same day editor used by calendar taps for today's local date.
2. Add a workout/session type field with these exact preset options: `Chest`, `Back`, `Legs`, `Shoulders`, `Cardio`, `Running`, `Push`, `Pull`, `Upper Body`, `Lower Body`. The field must also accept a manually typed custom name. Do not require a preset choice.
3. Add searchable exercise selection using the static library plus the signed-in user's own saved/custom exercises. A user can still type and save a completely custom name.
4. For normal strength exercises, retain the simple fields: exercise, sets, reps, weight, and optional notes. Default weight unit to kg; keep the existing kg/lb/bodyweight support if already present in the editor.
5. Add visible minus/plus stepper buttons for sets, reps, and weight. Buttons must work with mouse and touch and have accessible labels. Keep the number input editable by keyboard.
6. When the selected entry is a cardio/running entry, hide sets, reps, and weight. Show distance (km) and speed (km/h) instead. A `Running` session should default to a cardio entry, but allow the user to choose a cardio exercise/activity name.
7. Keep editing and deleting existing entries. When editing a row, populate all matching fields, including `entry_type`, `distance_km`, and `speed_kmh`.
8. Existing entries must render correctly: missing new fields mean an old strength entry, not an error.

### Phase C — mobile-first dashboard and calendar

1. Authenticated guest and registered accounts must render the **same dashboard components in the same order**. Do not hide workout logging, calendar, charts, or history for guests.
2. Reorder sections as follows:
   - Top header/account controls (compact on mobile).
   - First main section: full-width **Log today's workout** action.
   - Second main section: compact current/selected month calendar.
   - Third section: the existing **Weekly Summary** seven-day chart, corrected to fetch its own seven-day data.
   - Fourth section: monthly leaderboard for the month shown in the calendar.
   - Then keep useful existing monthly summary cards, exercise-focus chart, and recent history without letting them interrupt the first four sections. A practical order is summary cards, exercise focus, recent history.
3. Put month navigation in/next to the calendar: previous month, month/year label, next month, and a `Today` shortcut. Remove duplicate large navigation controls from the top header if they become redundant.
4. Create a calendar that looks like a native mobile calendar month grid: seven weekday columns, compact date numbers, a small status dot/indicator, selected-day styling, and a clear today outline. Show all 42 cells if the current helper produces them, but dates outside the selected month should be visually muted.
5. Calendar statuses and colors:
   - `empty`: neutral/gray; no workout marker.
   - `workout`: green.
   - `rest`: blue.
   - `skipped`: amber/orange.
   Keep the status meaning visible through a legend and/or accessible text; do not rely on color alone.
6. Clicking any date opens the day editor for that date. If a visible leading/trailing date from a neighboring month is clicked, navigate the calendar to that date's month and open the date editor.
7. Load the full visible calendar date range (first visible cell through last visible cell) so leading/trailing dates can show their actual statuses. Monthly summary calculations must still include only the selected month.
8. Mobile requirements:
   - Design for 320px, 360px, 375px, and 390px viewport widths first.
   - Calendar stays seven columns at every width; each day cell shrinks, not the number of columns.
   - No horizontal page scrolling.
   - Use at least 44px touch targets for primary buttons, icon/date controls, +/- buttons, and row actions.
   - Inputs and buttons must not be too small or crowded. Use full-width primary actions on narrow screens.
   - Day editor becomes a full-screen sheet or near-full-screen bottom sheet on mobile. Keep a clear close control and scroll the editor content, not the entire page behind it.
   - Respect mobile safe areas with `env(safe-area-inset-bottom)` when useful.
   - Retain a sensible desktop layout; do not make desktop worse to solve mobile.
9. Do not add a bottom navigation bar unless the existing page genuinely needs one. The requested four main sections are enough.

### Phase D — profiles and leaderboard

1. Add a display name input to the existing guest-to-email registration/link form. The current app creates accounts by starting a guest session and linking an email; do not replace that flow with a different sign-up system.
2. Add a profile/account control for both guest and registered sessions so a display name can be added or edited later. Use `public.user_profiles` as the canonical display-name store. Guests may save a name but must not appear in the leaderboard.
3. On first login for an older registered account with no profile row, create a profile using `Athlete` as a safe placeholder and let the user edit it. Do not use an email address or email prefix as the public display name.
4. The leaderboard shows only non-anonymous/registered accounts, sorted by workout days in the selected month (highest first). Include users with zero workout days so the ranking is complete. Ties share the same rank (`rank()`), with display name as a stable secondary sort.
5. Do not show email, phone, auth metadata, or raw user UUID in the leaderboard. It should return only rank, display name, number of workout days, and whether the row belongs to the current user.
6. The leaderboard month is the calendar's selected month. Previous/next calendar navigation therefore also changes the leaderboard month. Show the month/year clearly; `Today` returns both to the current month.
7. All authenticated sessions (including guests) can view the same leaderboard section, but the database function must exclude `auth.users.is_anonymous = true` from leaderboard participants.
8. Do not expose other users' raw `workout_days`, `workout_entries`, or profile rows through broad SELECT policies. Use the narrowly scoped RPC in section 4 for aggregate results only.

### Phase E — final cleanup and verification

1. Update README setup steps to explain the new migration and profile/leaderboard behavior. Update `PROJECT_GUIDE.md` file map, data contract, and data flow.
2. Check no secret files were modified or added.
3. Run `npm run build`.
4. Run `git status --short` and confirm every changed file is an intentional change on `chore/documentation`.
5. Do not claim that the Supabase migration ran against the user's live project. Give the owner the exact migration file/path and state that it must be executed once in Supabase SQL Editor (or their migration workflow) before the new frontend is deployed.

## 3. Exact UI/data behavior

### Today's workout action

Use `formatDateKey(new Date())` from `src/lib/dateUtils.js` to get today's local date. The button calls the same `openDay(todayKey)` handler as the calendar. The day editor should show the date in a friendly format (for example, `Mon, 2 Nov`) while keeping the database key in `YYYY-MM-DD`.

If today's day has no row yet, use an in-memory default `{ date, status: 'empty', notes: '', workout_type: '' }`. Create the database row only when the user changes status, saves a workout entry, or otherwise explicitly saves the day.

### Workout/session type is not an exercise

There are two separate names in the form:

- **Workout type/session name:** one value on the day, e.g. `Chest`, `Push`, `Legs`, `Running`, or a custom label. Store it on `workout_days.workout_type`.
- **Exercise/activity name:** one or more rows inside that day, e.g. `Incline Dumbbell Press`, `Lat Pulldown`, or `Outdoor Run`. Store it in the existing `workout_entries.exercise_name` field.

Do not mistakenly save `Chest` as an exercise when it is the session category. Do not create a separate table just for workout categories.

### Strength entry shape

Example object passed to the existing save callback:

```js
{
  id: editingEntryId || undefined,
  entry_type: 'strength',
  exercise_name: 'Incline Dumbbell Press',
  sets: 3,
  reps: 10,
  weight: 20,
  weight_unit: 'kg',
  distance_km: null,
  speed_kmh: null,
  notes: ''
}
```

`sets` is the number of sets and `reps` is reps per set, matching the current schema and summary calculations. Do not create a separate database row for each individual set. Keep this intentionally simple.

### Cardio/running entry shape

```js
{
  id: editingEntryId || undefined,
  entry_type: 'cardio',
  exercise_name: 'Outdoor Run',
  sets: 0,
  reps: 0,
  weight: 0,
  weight_unit: 'kg',
  distance_km: 5.2,
  speed_kmh: 9.5,
  notes: ''
}
```

Use `distance_km` and `speed_kmh` as the stored units. Label them visibly as `Distance (km)` and `Speed (km/h)`. Do not display misleading `0 sets · 0 reps · 0 kg` for cardio. A displayed estimated duration may be calculated as `distance_km / speed_kmh * 60`, but do not persist a duplicate duration field.

### Stepper controls

Use one small reusable component in `DayDetailsModal.jsx` (or a tiny `NumberStepper.jsx`) rather than duplicating three unrelated implementations. The behavior should be equivalent to:

```jsx
function NumberStepper({ label, value, onChange, step = 1, min = 0 }) {
  const numericValue = Number(value || 0);
  const update = (next) => onChange(Math.max(min, Number(next.toFixed(2))));

  return (
    <div className="number-stepper">
      <label>{label}</label>
      <div className="number-stepper-controls">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => update(numericValue - step)}
        >−</button>
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => update(numericValue + step)}
        >+</button>
      </div>
    </div>
  );
}
```

Use `step=1, min=0` for sets and reps; use `step=0.5, min=0` for weight. Do not let buttons submit the form. If the user manually clears the numeric input while editing, allow the draft temporarily and normalize it on save. Buttons need a minimum 44px height/width.

### Exercise searching

- Search a local static list from `src/data/exerciseLibrary.js` and merge it with the logged-in user's saved names returned by `searchExercises`.
- Match case-insensitively and show a short category label (Chest, Back, Legs, etc.). Limit the visible results to a manageable 8–12 rows, but allow the user to keep typing to refine.
- Do not make a network request to wger/StrengthLog or another third-party source on every keystroke.
- Deduplicate names case-insensitively. Prefer the user's saved row when the same name exists in both sources.
- Keep an `Add custom exercise: <typed text>` action. Save a newly chosen custom name through the existing `upsertExercise(userId, name)` API so it appears in future searches for that account.
- Exercise library entries are shared frontend suggestions; user-created rows remain private to that user in `public.exercises`.

## 4. Supabase schema/migration specification

Create `supabase/migrations/20261102_mobile_workout_features.sql`. It must be additive and safe to run once on the current schema. Keep equivalent definitions in `supabase/schema.sql` for a fresh installation.

### 4.1 Add new columns

```sql
alter table public.workout_days
  add column if not exists workout_type text;

alter table public.workout_entries
  add column if not exists entry_type text not null default 'strength',
  add column if not exists distance_km numeric(8,2),
  add column if not exists speed_kmh numeric(8,2);
```

Add constraints only if they do not already exist. Use a `DO $$ ... $$` block and check `pg_constraint` by table and constraint name:

```sql
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
```

Old records receive `entry_type = 'strength'` through the default and remain valid. For strength records, cardio fields may be null.

### 4.2 Add user profiles

```sql
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
```

Only the owner can select/insert/update their raw profile row. Do **not** add a public SELECT policy to this table. The leaderboard RPC below returns only the display name and aggregate workout-day count.

### 4.3 Profile creation trigger and existing-account backfill

Create a trigger so newly created Supabase users (guest or registered) get a profile row. Store a safe placeholder if no name was entered. Keep function names schema-qualified and pin the search path because this is a `SECURITY DEFINER` function.

```sql
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
```

Backfill existing registered users without changing their auth records. Keep the display name private until the user chooses a better one:

```sql
insert into public.user_profiles (user_id, display_name)
select u.id, 'Athlete'
from auth.users as u
where u.is_anonymous = false
on conflict (user_id) do nothing;
```

If a profile row exists with `Athlete`, the user can edit it from the app. Do not derive a public display name from an email address.

### 4.4 Monthly leaderboard RPC — aggregate only

Use this function rather than adding cross-user SELECT policies. It counts unique workout-day rows for the month; `workout_days` already has a unique `(user_id, date)` constraint. It includes zero-day registered users and excludes anonymous users.

```sql
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
```

Security requirements:

- Keep `SECURITY DEFINER` plus `set search_path = ''`; all relations must be schema-qualified.
- Revoke the default broad execute privilege from `public` and `anon`; grant only to `authenticated`.
- The function must not return user UUID, email, raw day rows, notes, exercise details, or any other personal information.
- Do not alter RLS on `workout_days`, `workout_entries`, or `exercises` to make the leaderboard work.
- The function can be called by guest sessions to display the same leaderboard, but its query must exclude users whose `auth.users.is_anonymous` is true.
- If the Supabase SQL editor reports an error for any `auth.users` field or function grant, investigate the exact database error; do not remove the anonymity filter or broaden data access as a workaround.

### 4.5 API functions to add

Create `src/api/profiles.js` with simple functions in the same style as the existing API modules:

- `getMyProfile(userId)`: select `user_id, display_name` from `user_profiles`, filter by `user_id`, and return one row (or `null`).
- `saveMyProfile(userId, displayName)`: trim the name; reject blank or over 40 characters; upsert `{ user_id: userId, display_name: cleanName }` with `onConflict: 'user_id'`; return the saved row.
- Do not add any function that reads another user's profile row directly.

Create `src/api/leaderboard.js`:

```js
import { supabase } from '../lib/supabase';

export async function getMonthlyLeaderboard(monthDate) {
  const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-01`;
  const { data, error } = await supabase.rpc('get_monthly_leaderboard', {
    p_month: monthKey
  });
  if (error) throw error;
  return data || [];
}
```

The RPC is the only cross-user leaderboard data path.

### 4.6 Extend existing API payloads

- `saveWorkoutDay` must preserve and write `workout_type` when supplied. Do not accidentally set it to `null` when only changing status/notes; use the existing value or fetch it before saving when necessary.
- `getWorkoutDaysForMonth` remains user-scoped and returns the new column automatically with `select('*')`.
- `saveWorkoutEntry` must write `entry_type`, `distance_km`, and `speed_kmh`; default missing `entry_type` to `strength`. For strength entries, normalize cardio metrics to null. For cardio entries, require positive distance and speed and store numeric values.
- Continue including `user_id` in writes and keep RLS as the final security boundary.
- Continue using the existing entry name snapshot so renaming/deleting a user's exercise library row does not erase the historical exercise name.

## 5. Profile UI and existing authentication flow

### Current registration behavior

The current UI does not use a separate `signUp` call. On the login screen, **Link Email** starts an anonymous session; in the guest panel, the user links an email with `supabase.auth.updateUser({ email })`, verifies that email, then sets a password. Preserve this exact account-continuity behavior because workout rows belong to the anonymous user's existing `user_id`.

### Required additions

1. In the guest **Sign up to keep your workouts** form, add a required `Display name` field (1–40 trimmed characters) next to email. Pass both values to the existing link handler.
2. Update the link handler to call the existing `supabase.auth.updateUser` with email and metadata:

   ```js
   await supabase.auth.updateUser(
     { email, data: { display_name: cleanDisplayName } },
     { emailRedirectTo: `${window.location.origin}${window.location.pathname}` }
   );
   ```

3. Save the same name to `user_profiles` using `saveMyProfile(userId, cleanDisplayName)`. The Supabase Auth user ID must remain unchanged.
4. Provide a small profile editor reachable from the authenticated header/account area for both guest and registered users. Show the current saved display name, editable text field, and Save button. Do not expose email or profile data in the leaderboard.
5. For an existing account, load the profile after auth is restored. If none exists (for example, an older account before migration/backfill), save a placeholder `Athlete`, then let the user edit it.
6. Keep profile-loading and profile-save errors visible with the app's existing error/message patterns. Disable Save while a request is in progress.
7. Use the profile table as the canonical display name in the UI and leaderboard. Auth user metadata is only the initial registration value/fallback, not the leaderboard query source.

Do not change the existing `passwordSetupUserKey`, verification redirect, recovery flow, anonymous sign-in flow, or sign-out behavior unless a focused bug fix is required.

## 6. Compact calendar specification

Use the existing `CalendarGrid` component and `getMonthDays()` helper as the starting point; do not install a calendar package.

### Layout

- One header row: previous-month button, month/year label, next-month button, and a small `Today` action.
- Seven weekday labels in one row.
- Seven date columns in every week row.
- Keep the current 42-cell helper if it makes the grid height stable.
- Each date cell has a centered date number and a small dot/marker or compact icon for its status. Do not put large words such as `workout` inside every day cell on mobile.
- Show a simple legend below the grid: Workout, Rest, Skipped, No log.
- Highlight today with an outline/ring; highlight a tapped/selected date with a separate selection treatment.
- Muted previous/next-month dates are lower contrast. Clicking one navigates the month and opens that date.

### Date data loading

The calendar has 42 visible dates but monthly summary values cover only the selected month. Use the visible first/last cell dates for the calendar data request; do not count adjacent-month records in monthly totals.

Suggested approach:

1. Build `calendarCells` from `getMonthDays(monthDate.getFullYear(), monthDate.getMonth())`.
2. Request workout days from `calendarCells[0].key` through `calendarCells[41].key`.
3. Build `workoutMap` keyed by each row's `date`.
4. Use a month prefix (`YYYY-MM`) or explicit start/end bounds when calculating selected-month cards and summaries.
5. When clicking an adjacent-month cell, call `setMonthDate(new Date(year, monthIndex, 1))` and `openDay(cell.key)`.

### Small-screen CSS guidance

Replace the current mobile rule that makes `.calendar-header-grid` and `.calendar-grid` two columns. Use a seven-column grid instead. The exact values can be tuned but the behavior should resemble:

```css
.calendar-header-grid,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.calendar-grid {
  gap: 4px;
  padding: 8px;
}

.day-cell {
  min-width: 0;
  min-height: 0;
  aspect-ratio: 1 / 1;
  padding: 4px 2px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.day-number {
  font-size: clamp(0.72rem, 3.2vw, 0.9rem);
}

.day-status {
  width: 6px;
  height: 6px;
  min-height: 6px;
  padding: 0;
  border-radius: 50%;
  font-size: 0;
}

@media (min-width: 769px) {
  .day-cell {
    aspect-ratio: 1.15 / 1;
    min-height: 72px;
    padding: 8px;
  }
}
```

Adapt class names to the final markup. Do not paste this blindly if it conflicts with component styles. At narrow widths the seven columns must fit without horizontal scroll.

## 7. Current-week chart and monthly leaderboard behavior

### Current-week chart

- Retain `src/components/WeeklySummary.jsx` and its existing visual idea (seven vertical bars, weekday labels, workout status colors, total sets).
- Its date range is always the most recent seven local calendar dates ending today, regardless of the month currently selected in the calendar.
- Add a separate loading query/state for those seven dates, including when the week crosses a month boundary. Do not depend on `workoutMap` or `monthEntries` for this chart.
- Query the seven dates' workout days; then query their entries by day IDs. An empty array for day IDs must return `[]` without calling `.in()` with an empty array.
- Continue to use workout status for bar color and sum sets for the numeric count. Cardio entries should contribute zero sets, not fake sets.
- Keep the seven day labels readable on mobile and avoid a wide chart.

### Monthly leaderboard

- Add `Leaderboard.jsx` or a similarly named small component. It receives rows, selected month, loading/error state, and current user ID only if the component needs it; the RPC already returns `is_current_user`.
- Show columns/rows: rank, display name, workout days. Highlight the current user's registered row subtly. Do not display emails.
- Show a friendly empty state if there are no registered profiles yet.
- Ties share the same rank number. Order ties alphabetically by display name for stable presentation.
- The RPC month input is the first day of the currently selected calendar month (`YYYY-MM-01`).
- Changing the selected month triggers a new leaderboard RPC request. Do not fetch every historical month up front.
- Registered means `auth.users.is_anonymous = false`; guests can see the same leaderboard, but are never included as participants.
- A workout day means one `workout_days` row with `status = 'workout'`. Count each date once. Do not rank by number of exercises, sets, reps, volume, login count, or streak length.

## 8. Starter exercise library — put these names into the app

Create `src/data/exerciseLibrary.js`. The library is a list of generic exercise/activity names grouped by category. Each item should have at least `{ name, category }`. Keep it local and searchable. These are suggestions, not mandatory choices; custom user names remain allowed.

Use the following starter set (about 180 movements). Remove accidental exact duplicates but do not shrink the library to only 10–20 examples.

### Chest

- Barbell Bench Press
- Incline Barbell Bench Press
- Decline Barbell Bench Press
- Dumbbell Bench Press
- Incline Dumbbell Bench Press
- Decline Dumbbell Bench Press
- Dumbbell Chest Fly
- Incline Dumbbell Fly
- Cable Chest Fly
- Low-to-High Cable Fly
- High-to-Low Cable Fly
- Pec Deck Fly
- Machine Chest Press
- Smith Machine Bench Press
- Push-Up
- Wide-Grip Push-Up
- Incline Push-Up
- Decline Push-Up
- Weighted Push-Up
- Chest Dip

### Back

- Conventional Deadlift
- Rack Pull
- Barbell Bent-Over Row
- Pendlay Row
- One-Arm Dumbbell Row
- Chest-Supported Dumbbell Row
- Chest-Supported Machine Row
- Seated Cable Row
- Wide-Grip Seated Cable Row
- Close-Grip Seated Cable Row
- Lat Pulldown
- Wide-Grip Lat Pulldown
- Close-Grip Lat Pulldown
- Reverse-Grip Lat Pulldown
- Assisted Pull-Up
- Pull-Up
- Neutral-Grip Pull-Up
- Straight-Arm Pulldown
- T-Bar Row
- Machine Row
- Inverted Row
- Back Extension
- Superman Hold
- Dumbbell Shrug
- Barbell Shrug

### Shoulders

- Barbell Overhead Press
- Seated Dumbbell Shoulder Press
- Standing Dumbbell Shoulder Press
- Arnold Press
- Machine Shoulder Press
- Dumbbell Lateral Raise
- Cable Lateral Raise
- Lean-Away Cable Lateral Raise
- Dumbbell Front Raise
- Plate Front Raise
- Rear Delt Dumbbell Fly
- Reverse Pec Deck
- Face Pull
- Cable Rear Delt Fly
- Upright Row
- Pike Push-Up
- Handstand Push-Up
- Landmine Shoulder Press

### Biceps

- Barbell Biceps Curl
- EZ-Bar Curl
- Dumbbell Biceps Curl
- Alternating Dumbbell Curl
- Hammer Curl
- Cross-Body Hammer Curl
- Incline Dumbbell Curl
- Preacher Curl
- Cable Biceps Curl
- Rope Hammer Curl
- Concentration Curl
- Spider Curl
- Reverse Curl
- Zottman Curl
- Machine Biceps Curl

### Triceps

- Rope Triceps Pushdown
- Straight-Bar Triceps Pushdown
- Reverse-Grip Triceps Pushdown
- Overhead Cable Triceps Extension
- Overhead Dumbbell Triceps Extension
- EZ-Bar Skull Crusher
- Lying Triceps Extension
- Close-Grip Bench Press
- Bench Dip
- Parallel-Bar Dip
- Dumbbell Triceps Kickback
- Cable Triceps Kickback
- Diamond Push-Up
- JM Press

### Legs and glutes

- Barbell Back Squat
- Barbell Front Squat
- Goblet Squat
- Smith Machine Squat
- Hack Squat
- Leg Press
- Bulgarian Split Squat
- Walking Lunge
- Reverse Lunge
- Forward Lunge
- Dumbbell Lunge
- Step-Up
- Leg Extension
- Seated Leg Curl
- Lying Leg Curl
- Romanian Deadlift
- Dumbbell Romanian Deadlift
- Stiff-Leg Deadlift
- Good Morning
- Hip Thrust
- Barbell Hip Thrust
- Glute Bridge
- Single-Leg Glute Bridge
- Cable Pull-Through
- Sumo Deadlift
- Sumo Squat
- Kettlebell Goblet Squat
- Single-Leg Romanian Deadlift
- Glute Kickback
- Cable Glute Kickback
- Hip Abduction Machine
- Hip Adduction Machine
- Standing Calf Raise
- Seated Calf Raise
- Single-Leg Calf Raise
- Leg Press Calf Raise
- Donkey Calf Raise

### Core and abs

- Plank
- Side Plank
- Reverse Plank
- Reverse Crunch
- Bicycle Crunch
- Crunch
- Weighted Crunch
- Sit-Up
- Decline Sit-Up
- Hanging Knee Raise
- Hanging Leg Raise
- Captain's Chair Knee Raise
- Lying Leg Raise
- Toe Touch
- Russian Twist
- Cable Crunch
- Ab Wheel Rollout
- Dead Bug
- Bird Dog
- Pallof Press
- Mountain Climber
- Flutter Kick
- Hollow Body Hold
- Wood Chop

### Cardio / distance-tracked activities

- Outdoor Run
- Treadmill Run
- Sprint
- Interval Run
- Outdoor Walk
- Treadmill Walk
- Incline Walk
- Hiking
- Outdoor Cycling
- Stationary Bike
- Spin Bike
- Mountain Biking
- Swimming
- Rowing Machine
- Outdoor Rowing
- Elliptical Trainer
- Stair Climber
- Ski Erg
- Air Bike
- Jump Rope

### Full body / functional strength

- Kettlebell Swing
- Kettlebell Clean
- Kettlebell Snatch
- Turkish Get-Up
- Barbell Clean
- Power Clean
- Clean and Press
- Clean and Jerk
- Barbell Snatch
- Thruster
- Burpee
- Man Maker
- Farmer's Carry
- Suitcase Carry
- Sled Push
- Sled Pull
- Battle Rope Waves

For the cardio items, use the cardio entry form (distance and speed) only for activities where distance/speed are useful. For a non-distance activity such as battle ropes, use a simple activity label and do not force meaningless distance values; if supporting timed cardio is desired later, add it as a separate small enhancement rather than complicating this task.

### Workout/session category presets

These are day-level `workout_type` choices, not entries in the exercise library:

```js
export const WORKOUT_TYPES = [
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Cardio',
  'Running',
  'Push',
  'Pull',
  'Upper Body',
  'Lower Body'
];
```

Allow custom typed values in addition to these options.

### Exercise library sources and attribution notes

Use these public exercise directories as reference material when expanding or checking names:

- wger REST API documentation: https://wger.readthedocs.io/en/latest/api/api.html
- wger project and exercise-data licensing: https://wger.readthedocs.io/en/latest/ (the documentation says the application is AGPL-3-or-later and the initial exercise/ingredient data has additional Creative Commons licensing; individual records may have different licenses).
- StrengthLog exercise directory: https://www.strengthlog.com/exercise-directory/ (use it as a naming/reference index, not as permission to copy its descriptions, videos, or images into this app).

This file's starter list is a practical compilation of generic exercise names. Do not copy third-party exercise descriptions, photos, or videos. If the agent imports records from wger in a later change, preserve the individual record's author/credit and license metadata and comply with the relevant CC BY-SA/CC0 terms. Do not assume every wger row has the same license.

## 9. Styling and interaction checklist

- Continue using CSS custom properties already defined near the top of `src/index.css`; reuse green/blue/orange/neutral status colors.
- Create small component-specific classes. Avoid a full redesign of every desktop surface.
- Use `min-width: 0` on grid children and inputs to prevent overflow.
- Use `clamp()` for headings/padding only where it helps responsive sizing.
- Avoid tiny all-caps text for important calendar labels.
- Every interactive control must have a visible focus state (`:focus-visible`).
- Use real `<button type="button">` elements for date, +/- and modal controls. Form submit buttons use `type="submit"`.
- Add `aria-label` to icon-only controls and appropriate labels to inputs.
- Add `role="dialog"`, `aria-modal="true"`, and a meaningful accessible title to the day editor. Escape should close the editor; clicks inside the editor must not close it. Prevent background scrolling while the mobile sheet is open. Restore scrolling on close.
- Do not use color as the only indication of rest/workout/skipped status; include a text legend and accessible day label.
- Avoid hover-only behaviors; touch users must be able to complete every action.
- No horizontal scrolling at 320px. Check the calendar, leaderboard rows, profile editor, and workout entry form at narrow widths.

## 10. Manual acceptance tests

Run these checks after implementation. Do not mark the task complete just because the build succeeds.

### Branch and build

- [ ] `git branch --show-current` prints `chore/documentation`.
- [ ] No unrelated existing changes were overwritten.
- [ ] `npm run build` completes successfully.

### Authentication/profile

- [ ] Existing email/password user can log in and sees the full dashboard.
- [ ] Guest can sign in and sees the exact same workout/calendar/chart/leaderboard interface.
- [ ] Guest can enter a name while linking an email; linking does not change their user ID or lose existing workouts.
- [ ] A registered user can edit the display name later and the new name appears in the leaderboard after refresh.
- [ ] A guest can set a display name but never appears as a leaderboard participant.
- [ ] An older account without a profile row receives the safe `Athlete` placeholder and can edit it.
- [ ] Password reset, email verification, password setup, and sign-out still work.

### Workout logging

- [ ] `Log today's workout` opens today's local date.
- [ ] Calendar tap opens the correct date.
- [ ] Session category can be selected from the presets or typed manually.
- [ ] Strength exercise can be searched, selected, or manually created.
- [ ] Sets, reps, and weight +/- buttons increment/decrement correctly and never go below zero.
- [ ] Keyboard/manual numeric entry still works.
- [ ] Save, edit, and delete entries work after a page refresh.
- [ ] Running/cardio shows distance and speed, hides sets/reps/weight, and saves positive values.
- [ ] Old strength entries still load and edit correctly after migration.
- [ ] Workout/rest/skipped/empty day status can still be changed.

### Calendar/charts/leaderboard

- [ ] Calendar is seven columns on desktop and on 320px/360px/375px/390px mobile screens.
- [ ] Empty/workout/rest/skipped colors and legend are visible and consistent.
- [ ] Today and selected date are visually distinct.
- [ ] A leading/trailing date navigates to its month and opens correctly.
- [ ] Monthly cards count only the selected month.
- [ ] Weekly chart always shows the seven actual dates ending today, even when the selected calendar month is historical or the week crosses a month boundary.
- [ ] Leaderboard counts only distinct workout-status days for the selected month.
- [ ] The previous-month/next-month calendar controls change the leaderboard month.
- [ ] Ties share rank; rows are stable; zero-day registered users appear.
- [ ] No emails, auth IDs, notes, or exercise details from other users are returned by the leaderboard RPC.

### Responsive/accessibility

- [ ] No horizontal page scroll at 320px width.
- [ ] Main buttons and +/- buttons have at least 44px touch targets.
- [ ] Day editor is comfortable to use as a mobile full-screen/bottom sheet.
- [ ] Focus indicators and visible input labels are present.
- [ ] Keyboard can operate the primary buttons, form fields, date cells, and close action.

## 11. Final response/report to the repository owner

When the implementation work is done, report:

1. The branch name used (`chore/documentation`).
2. The files changed.
3. The migration filename and a clear note that it must be run against the Supabase project before deploying the frontend.
4. Whether `npm run build` passed.
5. Any manual acceptance test that could not be verified.

Do not claim the app was deployed or that a live Supabase migration was applied unless that action was actually performed and confirmed.

