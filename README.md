# Workout Tracker

A polished, calendar-based workout tracker with weekly summaries, history, and exercise volume insights.

For the full architecture, data-flow, and feature change-point reference, see
[PROJECT_GUIDE.md](./PROJECT_GUIDE.md).

## Features
- Monthly calendar
- Day-by-day workout tracking
- Searchable exercise library
- Sets, reps, and weight logging
- Weekly summary chart
- Recent workout history
- Exercise focus breakdown
- Monthly sets, reps, workout-day, and weighted-volume summaries
- Email sign-in, guest access, account linking, and password recovery
- Modern dark UI

## Tech stack
- React + Vite
- Supabase
- GitHub Pages

## Setup
1. Create a Supabase project
2. Run the SQL from `supabase/schema.sql`
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
