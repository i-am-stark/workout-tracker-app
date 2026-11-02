# Workout Tracker — Project Guide

This guide explains the application as it exists in the repository: how it is
structured, how data moves through it, where features live, and how to run and
change it. It is intended for developers who are new to the project as well as
contributors modifying existing behavior.

## What the application does

Workout Tracker is a calendar-based workout log. A signed-in user can mark a
date as a workout, rest day, skipped day, or empty day; add notes; and record
exercise entries as strength or distance-based cardio. Days can have a workout
type, and entries can use the local exercise library or a custom name. The
dashboard includes a compact month calendar, an independently loaded seven-day
summary, a registered-user monthly leaderboard, monthly metrics, exercise
focus, and recent history.

The browser application is built with React and Vite. Supabase provides
authentication, PostgreSQL storage, and row-level security. There is no
application server in this repository: the browser calls Supabase directly
through the Supabase JavaScript client.

## Repository map

```text
.
├── .github/
│   └── workflows/
│       └── deploy.yml
├── src/
│   ├── api/
│   │   ├── exercises.js
│   │   ├── leaderboard.js
│   │   ├── monthlyPrComparison.js
│   │   ├── profiles.js
│   │   ├── workoutDays.js
│   │   └── workoutEntries.js
│   ├── components/
│   │   ├── AccountPanel.jsx
│   │   ├── CalendarGrid.jsx
│   │   ├── DayDetailsModal.jsx
│   │   ├── ExerciseChart.jsx
│   │   ├── ExerciseSearch.jsx
│   │   ├── HistoryList.jsx
│   │   ├── Leaderboard.jsx
│   │   ├── MonthlyPrComparison.jsx
│   │   ├── SummaryCards.jsx
│   │   └── WeeklySummary.jsx
│   ├── data/
│   │   └── exerciseLibrary.js
│   ├── lib/
│   │   ├── dateUtils.js
│   │   ├── supabase.js
│   │   └── workoutEntryUtils.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── supabase/
│   ├── migrations/
│   │   ├── 20261102_mobile_workout_features.sql
│   │   ├── 20261102_monthly_pr_comparison.sql
│   │   └── 20261102_per_set_reps_weights.sql
│   └── schema.sql
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── README.md
└── PROJECT_GUIDE.md
```

### Root and deployment files

| File | Purpose |
| --- | --- |
| [README.md](./README.md) | Short overview, initial Supabase setup, sign-in guidance, and GitHub Pages deployment instructions. |
| [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) | This deeper architecture, data-flow, and feature-editing reference. |
| [package.json](./package.json) | Runtime dependencies and the `dev`, `build`, and `preview` scripts. |
| [package-lock.json](./package-lock.json) | npm's resolved dependency graph. Keep it in sync when changing dependencies; use `npm ci` for reproducible installs. |
| [index.html](./index.html) | Vite HTML entry point, page metadata, and the `#root` mount element. |
| [vite.config.js](./vite.config.js) | React plugin, development server settings, and relative asset base for project-site deployment. |
| [.gitignore](./.gitignore) | Excludes dependencies, build output, local environment files, Vite cache, and macOS metadata. |
| [.github/workflows/deploy.yml](./.github/workflows/deploy.yml) | Builds on pushes to `main` or manual dispatch, then deploys the `dist` artifact to GitHub Pages. |
| [supabase/schema.sql](./supabase/schema.sql) | Complete fresh-install schema, indexes, constraints, own-row policies, profile trigger, and leaderboard RPC. |
| [supabase/migrations/20261102_mobile_workout_features.sql](./supabase/migrations/20261102_mobile_workout_features.sql) | Additive upgrade for existing databases: workout/cardio fields, profiles, and aggregate leaderboard RPC. |
| [supabase/migrations/20261102_per_set_reps_weights.sql](./supabase/migrations/20261102_per_set_reps_weights.sql) | Adds a JSONB array for per-set reps and weight without rewriting existing records. |
| [supabase/migrations/20261102_monthly_pr_comparison.sql](./supabase/migrations/20261102_monthly_pr_comparison.sql) | Adds a restricted aggregate RPC for top athletes' highest exercise PRs. |

### Application source

| Area | Files | Responsibility |
| --- | --- | --- |
| Bootstrap | [src/main.jsx](./src/main.jsx), [index.html](./index.html) | Mounts React into the page, loads global CSS, and starts `App`. |
| Page orchestration | [src/App.jsx](./src/App.jsx) | Owns authentication, selected month, loaded records, dashboard calculations, user actions, and the composition of the page. |
| Supabase client | [src/lib/supabase.js](./src/lib/supabase.js) | Reads the Vite environment variables, detects missing configuration, and creates the persistent Supabase browser client. |
| API/data access | [src/api/exercises.js](./src/api/exercises.js), [src/api/workoutDays.js](./src/api/workoutDays.js), [src/api/workoutEntries.js](./src/api/workoutEntries.js), [src/api/profiles.js](./src/api/profiles.js), [src/api/leaderboard.js](./src/api/leaderboard.js), [src/api/monthlyPrComparison.js](./src/api/monthlyPrComparison.js) | Encapsulates user-scoped table queries and narrowly scoped leaderboard/PR aggregate RPCs. |
| Exercise suggestions | [src/data/exerciseLibrary.js](./src/data/exerciseLibrary.js) | Provides the static categorized suggestions and workout-type presets; custom names remain per-user. |
| Date helpers | [src/lib/dateUtils.js](./src/lib/dateUtils.js) | Formats local date keys and builds calendar cells, month titles, and date labels. |
| Account UI | [src/components/AccountPanel.jsx](./src/components/AccountPanel.jsx) | Renders login, guest-account linking, password setup/recovery, and authentication feedback. |
| Calendar and day editing | [src/components/CalendarGrid.jsx](./src/components/CalendarGrid.jsx), [src/components/DayDetailsModal.jsx](./src/components/DayDetailsModal.jsx), [src/components/ExerciseSearch.jsx](./src/components/ExerciseSearch.jsx) | Displays a seven-column date grid and supports day/session editing, exercise lookup, strength/cardio entry editing. |
| Dashboard views | [src/components/SummaryCards.jsx](./src/components/SummaryCards.jsx), [src/components/WeeklySummary.jsx](./src/components/WeeklySummary.jsx), [src/components/Leaderboard.jsx](./src/components/Leaderboard.jsx), [src/components/MonthlyPrComparison.jsx](./src/components/MonthlyPrComparison.jsx), [src/components/ExerciseChart.jsx](./src/components/ExerciseChart.jsx), [src/components/HistoryList.jsx](./src/components/HistoryList.jsx) | Present monthly metrics, the current week, safe leaderboard and PR comparisons, exercise totals, and recent workout dates/types. |
| Visual design | [src/index.css](./src/index.css) | Defines the dark theme, shared controls, component layouts, state colors, and responsive breakpoints. |

## Architecture and responsibilities

### Runtime shape

The application has four practical layers:

1. **Entry point:** `index.html` loads `src/main.jsx`; the latter imports
   `App.jsx` and the global stylesheet and mounts the React tree.
2. **Page/controller:** `App.jsx` is the stateful coordinator. It handles
   Supabase auth events, chooses which account view to show, loads records for
   the active user and month, and passes data and callbacks into UI components.
3. **Presentational and interaction components:** components render sections
   and manage local form state. They call the callbacks supplied by `App`
   rather than accessing Supabase directly.
4. **Data and infrastructure:** API modules query Supabase tables; the
   Supabase client and date helpers are in `src/lib`; `supabase/schema.sql`
   defines the remote data contract.

There is no router, global state package, charting library, or separate
backend. Page state is held in React hooks in `App.jsx`, component-specific
form state stays local, and charts are rendered with simple CSS bars.

### Component and data relationships

```text
index.html
  └── src/main.jsx
       └── src/App.jsx
            ├── src/lib/supabase.js ── Supabase Auth
            ├── src/api/* ──────────── Supabase tables
            ├── AccountPanel
            ├── CalendarGrid
            ├── WeeklySummary
            ├── Leaderboard
            ├── SummaryCards
            ├── ExerciseChart
            ├── HistoryList
            └── DayDetailsModal
                 └── ExerciseSearch
```

`App` passes values and event handlers into child components. For example,
`CalendarGrid` receives the already-loaded day map and invokes `onDateClick`;
`App` fetches the selected day and its entries, then passes them to
`DayDetailsModal`. Saving an entry is similarly initiated in the modal, handled
by `App`, and persisted through the API modules.

### State ownership in `App.jsx`

The primary state groups are:

- **Authentication:** `authUser`, `userId`, initialization/loading flags,
  busy state, messages/errors, password recovery/setup flags, and guest sign-up
  visibility.
- **Dashboard selection:** `monthDate` drives the displayed month and its
  calendar and monthly leaderboard query.
- **Visible calendar data:** `workoutMap` maps the full visible 42-day range
  (`YYYY-MM-DD`) to workout-day rows. `monthEntries` contains only entries from
  the selected month so adjacent-month cells do not affect monthly metrics.
- **Current week:** `weeklyDays` and `weeklyEntries` are queried independently
  for the seven local dates ending today; they do not depend on the selected
  calendar month.
- **Profile and leaderboard:** `profile` is the current user's private
  `user_profiles` row. Leaderboard rows come only from the aggregate RPC.
- **Cross-month summaries:** `recentEntries` and `exerciseVolume` are loaded
  separately from the active month.
- **Day editor:** `selectedDate`, `modalDay`, and `dayEntries` represent the
  open modal and its current records.

When the authenticated user changes, `applySessionUser` clears data belonging
to the previous account before loading the new account's records. An effect
subscribes to Supabase auth changes and initializes from any persisted session.
The calendar-loading effect fetches day rows spanning the first through last
visible calendar cells. It then loads selected-month entries, recent workout
days, and all-time exercise totals. A separate effect fetches the latest seven local
dates and their entries, while the leaderboard API requests only the selected
calendar month.

## Main user and data flows

### Authentication and account continuity

`src/lib/supabase.js` creates a client only when both `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` are present. Supabase session persistence and token
refresh are enabled. If configuration is missing, `App` displays a setup
message instead of making database calls.

The authentication UI and handlers support:

- Email/password sign-in for an existing account.
- Anonymous guest sessions.
- Starting an anonymous session from **Link Email**, then attaching an email
  to that same user through Supabase `updateUser`.
- Email verification followed by password setup, preserving the guest
  account's user ID and therefore its workout ownership.
- Password reset email and password recovery.
- Sign-out and retrying session initialization.

`App.jsx` handles the Supabase operations; `AccountPanel.jsx` owns the form
inputs and delegates submissions through callbacks. A local-storage key tracks
the user who needs to complete password setup after email verification. The
redirect URL is constructed from the current origin and pathname, so local
development and a GitHub Pages project path can both be used when they are
allowlisted in Supabase.

### Loading the dashboard

When a user ID is available, `App` requests workout days bounded by the first
and last date of `monthDate`. It then:

1. Fetches entries for those day IDs.
2. Fetches the ten most recently created entries for history.
3. Fetches all entries to aggregate all-time exercise focus.
4. Builds a date-keyed map used by the calendar and summary components.

Changing the month changes the date range and reloads month-specific days and
entries. Recent history and all-time exercise focus are also refreshed by that
load.

### Editing a day and recording exercises

Clicking a calendar cell calls `openDay` in `App`. The app retrieves the
existing day row and its entries (or creates an empty in-memory representation
if there is no row yet), then opens `DayDetailsModal`.

The modal can:

- Set the date status to `empty`, `workout`, `rest`, or `skipped`.
- Select a preset or typed workout/session name stored on the day.
- Save day notes after a short debounce; closing the modal flushes unsaved
  notes.
- Search the static categorized library together with the user's private saved
  exercise names, or enter a new name.
- Add, edit, or delete a strength entry (sets, reps, weight/unit) or
  distance-based cardio entry (kilometres and km/h).

On entry save, `App` upserts the exercise name, ensures a workout-day row
exists with `workout` status and the current workout type, saves or updates the
entry, and refreshes the open day and dashboard data. Deleting an entry
refreshes the same views. Database errors are surfaced through the app-level
error banner. Profile updates use the owner-scoped profile API; the leaderboard
uses only `get_monthly_leaderboard`, and the PR comparison uses only the
restricted `get_monthly_pr_comparison` RPC, never cross-user table reads.

## Database model

The schema is defined in [supabase/schema.sql](./supabase/schema.sql).

| Table | Role | Key relationships and constraints |
| --- | --- | --- |
| `workout_days` | One user's status, notes, and workout/session type for a calendar date. | Unique `(user_id, date)`; status restricted to `empty`, `workout`, `rest`, or `skipped`; `workout_type` is optional and may be custom text. |
| `exercises` | Per-user reusable exercise names. | Unique `(user_id, name)`. The UI uses a name snapshot on entries, so historical entries remain readable if an exercise library record is removed. |
| `workout_entries` | A logged strength exercise or distance-based cardio activity within a workout day. | `day_id` references `workout_days` and cascades on day deletion; optional `exercise_id` becomes null if the exercise is removed. Stores a denormalized `exercise_name`, entry type, per-set reps/weight in `set_details`, compatibility aggregates, cardio distance/speed, notes, and ordering. |
| `user_profiles` | Private canonical display name for each auth user. | `user_id` references `auth.users`; owner-only select/insert/update policies; display names are 1–40 trimmed characters. |

Workout tables have `user_id`. Row-level security is enabled, with policies
that allow authenticated users to access only rows whose `user_id` matches
`auth.uid()`. API queries also filter by `user_id`, but database policies are
the actual server-side isolation boundary. Profile rows are also owner-only;
there is no broad cross-user profile or workout-day read policy.

The `get_monthly_leaderboard(date)` security-definer RPC returns only rank,
display name, workout-day count, and whether the row belongs to the caller. It
counts workout-status days for the month, includes zero-day registered users,
uses shared ranks for ties, and excludes anonymous auth users.
`get_monthly_pr_comparison(date)` uses the selected month's top five registered
athletes and returns only rank, display name, up to five all-time exercise PRs
per athlete, and kilogram weights. Neither RPC returns email, UUID, notes, or
raw day rows; the PR comparison is the only cross-user exercise aggregation.

For an existing database, run the SQL files in
[supabase/migrations/](./supabase/migrations/) in filename order before
deploying the updated frontend. New installations should use the complete
[supabase/schema.sql](./supabase/schema.sql).

The schema includes indexes for user/date, user/name, entry/day, and
entry/user lookups. The app expects the schema and these RLS policies to be
installed in the Supabase project before it can read or write workout data.

### Calculated metrics

- **Monthly workout days:** count of `workout_days` with status `workout` in
  the displayed month.
- **Monthly sets:** sum of entry `sets` in that month.
- **Monthly reps:** sum of `sets × reps` for each entry.
- **Personal records:** highest logged positive weight for each strength
  exercise, regardless of rep count. Pounds are converted to kilograms for
  comparison/display; bodyweight and cardio entries are excluded. The summary
  card shows the top record and opens the complete all-time list.
- **Weekly summary:** independently loads the seven local dates ending today,
  even when the week crosses a month boundary or a historical month is selected.
  Cardio entries contribute zero sets.
- **Monthly leaderboard:** uses only the selected calendar month and the
  aggregate leaderboard RPC; only registered (non-anonymous) accounts appear.
- **Monthly PR comparison:** selects the top five registered athletes by
  workout days in the selected month, then displays each athlete's five highest
  all-time exercise PRs. Comparison weights are converted to kilograms, and the
  restricted RPC does not expose account IDs or raw workout entries.
- **Exercise focus:** the eight exercise names with the most accumulated sets
  across the user's entries.
- **Recent history:** up to ten workout days ordered by date, showing the local
  workout date and the day's workout type.

The entry form records reps and weight separately for every strength set, with
the weight unit shared by that exercise entry. Older rows with empty
`set_details` continue to render by repeating their existing reps and weight
values across the stored set count. The database recognizes `kg`, `lb`, and
`bodyweight`. Cardio entries require
positive `distance_km` and `speed_kmh`; legacy rows default to strength. Changes
to entry types or units should update the form, API normalization, schema, and
summary/history displays together.

## Where to make changes

Use this map to find the smallest appropriate place for a feature change:

| Change you want | Start here | Also check |
| --- | --- | --- |
| Add a dashboard card or change dashboard layout | `src/App.jsx` for data and placement; `src/components/SummaryCards.jsx` for the cards | `src/index.css`; API fetches if the metric needs new data |
| Change a monthly statistic or calculation | `src/App.jsx` (`summary` calculation) | `src/components/SummaryCards.jsx`; entry unit semantics in `supabase/schema.sql` |
| Change calendar layout, month navigation, or date labels | `src/App.jsx`, `src/components/CalendarGrid.jsx` | `src/lib/dateUtils.js`, `src/index.css` |
| Add a day status or change notes behavior | `src/components/DayDetailsModal.jsx` and `src/App.jsx` | `workout_days` status constraint and policies in `supabase/schema.sql`; calendar CSS status classes |
| Add fields to an exercise entry | `src/components/DayDetailsModal.jsx`, `src/api/workoutEntries.js`, `supabase/schema.sql` | Editing/refresh flow in `src/App.jsx`; history, summaries, and any existing row migration |
| Change exercise search or duplicate handling | `src/components/ExerciseSearch.jsx`, `src/api/exercises.js` | `exercises` uniqueness and indexes in `supabase/schema.sql` |
| Add a new database entity or query | Add/extend a module in `src/api/` | Schema, RLS policy, `App.jsx` load/save flow, then affected components |
| Change login, guest linking, password reset, or sign-out | `src/App.jsx` auth handlers and `src/components/AccountPanel.jsx` | `src/lib/supabase.js`; Supabase provider, redirect, and linking settings |
| Change colors, spacing, responsive behavior, or component styling | `src/index.css` | JSX class names in the corresponding component |
| Change local/dev/build commands or runtime dependencies | `package.json` | `package-lock.json` and `vite.config.js` |
| Change GitHub Pages deployment | `.github/workflows/deploy.yml` | Repository secrets and Pages settings; `vite.config.js` base path |

For a database-backed feature, make the schema, API layer, page orchestration,
and visible component agree. In particular, adding a table is not complete
until its policies are in place and the app supplies the correct `user_id`.

## Local development and deployment

### Requirements

- Node.js and npm (the deployment workflow currently uses Node.js 20).
- A new Supabase project with `supabase/schema.sql` applied, or an existing
  project upgraded with the SQL files in `supabase/migrations/` in filename order.
- Anonymous sign-ins enabled if guest access is needed.
- The Email provider and Manual Linking enabled for email-linked guest
  accounts; configure the local and deployed URLs in Supabase's redirect
  allowlist.

### Run locally

1. Install the locked dependencies:

   ```sh
   npm ci
   ```

2. Create a `.env` file in the project root with the Supabase project URL and
   public anon key:

   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

   `.env.example` is referenced by the existing README and missing-config
   screen but is not present in the repository; create `.env` directly (or add
   a sanitized example file if the project later chooses to maintain one).
   Never put a Supabase service-role key in the browser app.

3. Start the Vite development server:

   ```sh
   npm run dev
   ```

   Vite listens on port `5173` and the configured host is `0.0.0.0`.

4. Open the local URL and sign in or start a guest session. Restart the dev
   server after changing Vite environment variables.

### Build and preview

```sh
npm run build
npm run preview
```

The production build is written to `dist/`, which is ignored by Git. There is
no test or lint script currently defined in `package.json`.

### GitHub Pages

The workflow in `.github/workflows/deploy.yml` runs for pushes to `main` and
manual dispatch. It installs with `npm ci`, builds with
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from repository Actions
secrets, uploads `dist/`, and deploys the artifact using GitHub Pages. It does
not push a `gh-pages` branch. The relative base in `vite.config.js` supports
the repository subpath used by the project site. Configure Pages to use GitHub
Actions and allow the deployed URL in Supabase authentication redirects.

## Design and styling

The UI uses a dark, responsive dashboard with colored state accents:
green for workouts, blue for rest, orange for skipped days, and subdued
surfaces for empty days. CSS custom properties at the top of
`src/index.css` define the palette and shadow. Shared classes style buttons,
inputs, panels, and status variants; component-specific class names keep each
dashboard section recognizable.

The main content uses CSS Grid for summary cards and insights. At widths below
900px, insights become a single column. The calendar remains seven columns at
mobile widths, and the day editor becomes a full-screen sheet. There is no
component library, CSS preprocessor, or external charting dependency.

When changing UI structure, keep component class names aligned with
`src/index.css`; use the existing CSS variables and status classes where
possible so responsive behavior and the visual language remain consistent.

## Practical contribution checklist

1. Identify whether the change belongs in a component, page orchestration, API
   module, shared utility, database schema, or more than one layer.
2. For stored data, update both the SQL contract and the API read/write path;
   preserve user scoping and RLS.
3. For derived metrics, verify the date range, units, aggregation, and display
   label together.
4. Keep account-specific data cleared/reloaded when the authenticated user
   changes.
5. Run `npm run build` after code changes. Add a test script and focused tests
   if test coverage is introduced; none are currently configured.
