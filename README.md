# Workout Tracker

A polished, calendar-based workout tracker with weekly summaries, history, and exercise volume insights.

For the full architecture, data-flow, and feature change-point reference, see
[PROJECT_GUIDE.md](./PROJECT_GUIDE.md).

## Features
- Monthly calendar
- Day-by-day workout tracking
- Searchable exercise library
- Strength and distance-based cardio logging
- Workout/session categories and custom exercises
- Mobile seven-column month calendar
- Weekly summary chart
- Monthly registered-athlete leaderboard
- Monthly comparison of top athletes' highest exercise PRs
- Editable private display-name profiles
- Recent workout history
- Exercise focus breakdown
- Monthly sets, reps, and workout-day summaries
- All-time highest-weight personal records by exercise
- Email sign-in, guest access, account linking, and password recovery
- Modern dark UI

## Tech stack
- React + Vite
- Supabase
- GitHub Pages

## Setup
1. Create a Supabase project
2. For a new project, run the complete SQL from `supabase/schema.sql`. For an
   existing project, run the SQL migration files in `supabase/migrations/` in
   filename order in the Supabase SQL Editor (or through your migration
   workflow) before deploying the updated frontend. Run
   `20261102_mobile_workout_features.sql`,
   `20261102_monthly_pr_comparison.sql`, and
   `20261102_per_set_reps_weights.sql` in filename order. Do not rerun the
   original schema as a substitute for these additive migrations.
3. Create `.env` in the project root and fill in:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Restart `npm run dev` after adding these values. The app displays a setup
   message if either value is missing. The repository does not currently include
   an `.env.example` file.
5. Enable anonymous sign-ins in your Supabase project's Authentication settings so the
   tracker can create a user session.
6. Enable the Email provider and Manual Linking in Supabase Authentication settings.
7. In Authentication → URL Configuration, allow both your local URL
   (`http://localhost:5173/`) and the deployed GitHub Pages URL
   (`https://i-am-stark.github.io/workout-tracker-app/`).

Profiles are private to each account; only a display name and monthly count of
workout days are returned by the leaderboard. Guest accounts can save a display
name and view the leaderboard, but anonymous users are not leaderboard participants.
The monthly PR comparison uses a restricted RPC to share up to five top strength
PRs by exercise for each of the top five registered leaderboard users. Weights
are shown in kilograms; emails, account IDs, and raw workout logs are not exposed.

## Deploy to GitHub Pages

The GitHub Actions workflow builds and deploys the site when code is pushed to `main`.
It can also be started manually from the repository's **Actions** tab using **Run
workflow**. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repository Actions
secrets, then set **Settings → Pages → Build and deployment → Source** to **GitHub
Actions**. The workflow deploys the generated Pages artifact directly; it does not
publish to a `gh-pages` branch. The Vite build uses a relative asset base, so it works
under the `/workout-tracker-app/` project-site path.

## Sign in and keep access to your workouts

Visitors see the login screen first. They can sign in with email, explicitly start a
guest session, or choose **Link Email** to start a guest session and attach an email.
Guest sessions can be upgraded with **Sign Up** without changing the user ID that owns
their workout records. Confirm the email from that browser and set a password when
prompted. On another browser or device, log in with the linked email and password.

Existing browser sessions are restored automatically. Do not clear browser data or sign
in to a different account before linking an anonymous session whose workouts you want to
keep. The app includes password-reset emails for account recovery. For GitHub Pages, add
the deployed site URL (including the repository path) to Supabase's redirect allowlist
as well as the local development URL.
