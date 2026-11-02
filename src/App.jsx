import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import {
  getWorkoutDaysForMonth,
  getRecentWorkoutDays,
  saveWorkoutDay,
  getWorkoutDay
} from './api/workoutDays';
import { searchExercises, upsertExercise } from './api/exercises';
import { getEntriesForDay, getEntriesForDays, getExerciseVolume, saveWorkoutEntry, deleteWorkoutEntry } from './api/workoutEntries';
import { CalendarGrid } from './components/CalendarGrid';
import { DayDetailsModal } from './components/DayDetailsModal';
import { SummaryCards } from './components/SummaryCards';
import { WeeklySummary } from './components/WeeklySummary';
import { HistoryList } from './components/HistoryList';
import { ExerciseChart } from './components/ExerciseChart';
import { AccountPanel } from './components/AccountPanel';
import { Leaderboard } from './components/Leaderboard';
import { formatDateKey, getMonthDays, getMonthTitle, getPastDays } from './lib/dateUtils';
import { exerciseLibrary } from './data/exerciseLibrary';
import { getMyProfile, saveMyProfile } from './api/profiles';
import { getMonthlyLeaderboard } from './api/leaderboard';
import { getMonthlyPrComparison } from './api/monthlyPrComparison';
import { getEntrySetDetails } from './lib/workoutEntryUtils';
import { getPersonalRecords } from './api/personalRecords';
import { PersonalRecordsModal } from './components/PersonalRecordsModal';
import { MonthlyPrComparison } from './components/MonthlyPrComparison';

const monthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const monthPrefix = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const getVisibleDays = (userId, date) => {
  const cells = getMonthDays(date.getFullYear(), date.getMonth());
  return getWorkoutDaysForMonth(userId, cells[0].key, cells[cells.length - 1].key);
};
const getMonthDayIds = (days, date) =>
  days.filter((day) => day.date.startsWith(monthPrefix(date))).map((day) => day.id);
const passwordSetupUserKey = 'workout-tracker-password-setup-user';

export default function App() {
  const [monthDate, setMonthDate] = useState(new Date());
  const [userId, setUserId] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const userIdRef = useRef(null);
  const [authRetryCount, setAuthRetryCount] = useState(0);
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [guestSignupOpen, setGuestSignupOpen] = useState(false);
  const [workoutMap, setWorkoutMap] = useState({});
  const [monthEntries, setMonthEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalDay, setModalDay] = useState(null);
  const [dayEntries, setDayEntries] = useState([]);
  const [weeklyDays, setWeeklyDays] = useState([]);
  const [weeklyEntries, setWeeklyEntries] = useState([]);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [dashboardRefreshToken, setDashboardRefreshToken] = useState(0);
  const [profile, setProfile] = useState(null);
  const [profileDraft, setProfileDraft] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [leaderboardRows, setLeaderboardRows] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState('');
  const [monthlyPrRows, setMonthlyPrRows] = useState([]);
  const [monthlyPrLoading, setMonthlyPrLoading] = useState(false);
  const [monthlyPrError, setMonthlyPrError] = useState('');
  const [personalRecords, setPersonalRecords] = useState([]);
  const [personalRecordsLoading, setPersonalRecordsLoading] = useState(false);
  const [personalRecordsError, setPersonalRecordsError] = useState('');
  const [showPersonalRecords, setShowPersonalRecords] = useState(false);
  const [recentWorkoutDays, setRecentWorkoutDays] = useState([]);
  const [exerciseVolume, setExerciseVolume] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialising, setIsInitialising] = useState(true);
  const [error, setError] = useState('');

  function applySessionUser(user) {
    const nextUserId = user?.id || null;
    if (userIdRef.current !== nextUserId) {
      userIdRef.current = nextUserId;
      setError('');
      setWorkoutMap({});
      setMonthEntries([]);
      setRecentWorkoutDays([]);
      setExerciseVolume([]);
      setSelectedDate(null);
      setModalDay(null);
      setDayEntries([]);
      setProfile(null);
      setProfileDraft('');
      setPersonalRecords([]);
      setShowPersonalRecords(false);
      setIsLoading(Boolean(nextUserId));
    }
    if (!user?.is_anonymous) {
      setGuestSignupOpen(false);
    }
    setAuthUser(user);
    setUserId(nextUserId);
  }

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      setIsInitialising(false);
      setIsLoading(false);
      return () => {
        mounted = false;
      };
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      applySessionUser(session?.user || null);
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setAuthMessage('Choose a new password to finish resetting your account.');
      } else if (
        session?.user
        && !session.user.is_anonymous
        && session.user.email_confirmed_at
        && localStorage.getItem(passwordSetupUserKey) === session.user.id
      ) {
        setShowPasswordSetup(true);
        setAuthMessage('Email verified. Set a password to finish securing your account.');
      } else if (event === 'SIGNED_IN') {
        setIsPasswordRecovery(false);
        setAuthError('');
        setAuthMessage('');
        setShowPasswordSetup(false);
      } else if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false);
        setShowPasswordSetup(false);
      }
    });

    async function init() {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (mounted && sessionData.session?.user) {
          const user = sessionData.session.user;
          applySessionUser(user);
          if (
            !user.is_anonymous
            && user.email_confirmed_at
            && localStorage.getItem(passwordSetupUserKey) === user.id
          ) {
            setShowPasswordSetup(true);
            setAuthMessage('Email verified. Set a password to finish securing your account.');
          }
        }
      } catch (err) {
        if (mounted) {
          setAuthError(err.message || 'Could not initialise app.');
          setIsLoading(false);
        }
      } finally {
        if (mounted) {
          setIsInitialising(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [authRetryCount]);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    let active = true;
    async function loadMonthData() {
      try {
        setIsLoading(true);

        const days = await getVisibleDays(userId, monthDate);
        const [entries, recent, volume] = await Promise.all([
          getEntriesForDays(userId, getMonthDayIds(days, monthDate)),
          getRecentWorkoutDays(userId, 10),
          getExerciseVolume(userId)
        ]);

        const map = {};
        days.forEach((day) => {
          map[day.date] = day;
        });

        if (active) {
          setWorkoutMap(map);
          setMonthEntries(entries);
          setRecentWorkoutDays(recent || []);
          setExerciseVolume(volume || []);
        }
      } catch (err) {
        if (active) setError(err.message || 'Could not load workout data.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadMonthData();
    return () => {
      active = false;
    };
  }, [userId, monthDate]);

  useEffect(() => {
    if (!userId) {
      setWeeklyDays([]);
      setWeeklyEntries([]);
      return;
    }

    let active = true;
    async function loadWeeklyData() {
      const daysInWeek = getPastDays(7);
      setWeeklyLoading(true);
      try {
        const days = await getWorkoutDaysForMonth(
          userId,
          daysInWeek[0].date,
          daysInWeek[daysInWeek.length - 1].date
        );
        const entries = await getEntriesForDays(userId, days.map((day) => day.id));
        if (active) {
          setWeeklyDays(days);
          setWeeklyEntries(entries);
        }
      } catch (err) {
        if (active) setError(err.message || 'Could not load weekly workout data.');
      } finally {
        if (active) setWeeklyLoading(false);
      }
    }

    loadWeeklyData();
    return () => {
      active = false;
    };
  }, [userId, dashboardRefreshToken]);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }

    let active = true;
    async function loadProfile() {
      setProfileError('');
      try {
        let nextProfile = await getMyProfile(userId);
        if (!nextProfile) nextProfile = await saveMyProfile(userId, 'Athlete');
        if (active) {
          setProfile(nextProfile);
          setProfileDraft(nextProfile.display_name);
        }
      } catch (err) {
        if (active) setProfileError(err.message || 'Could not load your profile.');
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLeaderboardRows([]);
      setMonthlyPrRows([]);
      return;
    }

    let active = true;
    async function loadLeaderboard() {
      setLeaderboardLoading(true);
      setLeaderboardError('');
      try {
        const rows = await getMonthlyLeaderboard(monthDate);
        if (active) setLeaderboardRows(rows);
      } catch (err) {
        if (active) setLeaderboardError(err.message || 'Could not load the monthly leaderboard.');
      } finally {
        if (active) setLeaderboardLoading(false);
      }
    }

    loadLeaderboard();
    return () => {
      active = false;
    };
  }, [userId, monthDate, dashboardRefreshToken, authUser?.is_anonymous]);

  useEffect(() => {
    if (!userId) {
      setMonthlyPrRows([]);
      return;
    }

    let active = true;
    async function loadMonthlyPrComparison() {
      setMonthlyPrLoading(true);
      setMonthlyPrError('');
      try {
        const rows = await getMonthlyPrComparison(monthDate);
        if (active) setMonthlyPrRows(rows);
      } catch (err) {
        if (active) {
          setMonthlyPrError(err.message || 'Could not load monthly PR comparisons.');
        }
      } finally {
        if (active) setMonthlyPrLoading(false);
      }
    }

    loadMonthlyPrComparison();
    return () => {
      active = false;
    };
  }, [userId, monthDate, dashboardRefreshToken, authUser?.is_anonymous]);

  useEffect(() => {
    if (!userId) {
      setPersonalRecords([]);
      return;
    }

    let active = true;
    async function loadPersonalRecords() {
      setPersonalRecordsLoading(true);
      setPersonalRecordsError('');
      try {
        const records = await getPersonalRecords(userId);
        if (active) setPersonalRecords(records);
      } catch (err) {
        if (active) {
          setPersonalRecordsError(err.message || 'Could not load personal records.');
        }
      } finally {
        if (active) setPersonalRecordsLoading(false);
      }
    }

    loadPersonalRecords();
    return () => {
      active = false;
    };
  }, [userId, dashboardRefreshToken]);

  async function handleLinkEmail(email, displayName) {
    setAuthBusy(true);
    setAuthError('');
    setAuthMessage('');
    try {
      if (!authUser?.is_anonymous) {
        throw new Error('Email linking is only available from the anonymous account that owns these records.');
      }
      const cleanDisplayName = displayName.trim();
      if (!cleanDisplayName || cleanDisplayName.length > 40) {
        throw new Error('Display name must be between 1 and 40 characters.');
      }

      const { error: linkError } = await supabase.auth.updateUser(
        { email, data: { display_name: cleanDisplayName } },
        { emailRedirectTo: `${window.location.origin}${window.location.pathname}` }
      );
      if (linkError) throw linkError;

      const savedProfile = await saveMyProfile(authUser.id, cleanDisplayName);
      setProfile(savedProfile);
      setProfileDraft(savedProfile.display_name);
      localStorage.setItem(passwordSetupUserKey, authUser.id);
      setAuthMessage(
        `A verification email was sent to ${email}. Open the link in this browser; you’ll then be prompted to set a password.`
      );
      return true;
    } catch (err) {
      setAuthError(
        `${err.message || 'Could not link this email.'} Check that Email and Manual Linking are enabled in Supabase Authentication settings.`
      );
      return false;
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignInAsGuest() {
    setAuthBusy(true);
    setAuthError('');
    setAuthMessage('');
    try {
      const { error: signInError } = await supabase.auth.signInAnonymously();
      if (signInError) throw signInError;
      return true;
    } catch (err) {
      setAuthError(err.message || 'Could not start a guest session.');
      return false;
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleStartEmailLink() {
    setAuthBusy(true);
    setAuthError('');
    setAuthMessage('');
    try {
      const { error: signInError } = await supabase.auth.signInAnonymously();
      if (signInError) throw signInError;
      setGuestSignupOpen(true);
      return true;
    } catch (err) {
      setAuthError(err.message || 'Could not start an account to link.');
      return false;
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignIn(email, password) {
    setAuthBusy(true);
    setAuthError('');
    setAuthMessage('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      setAuthMessage('Signed in. Your account workouts are loading.');
      return true;
    } catch (err) {
      setAuthError(err.message || 'Could not sign in.');
      return false;
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSetPassword(password) {
    setAuthBusy(true);
    setAuthError('');
    setAuthMessage('');
    try {
      if (!isPasswordRecovery) {
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!data.user?.email_confirmed_at) {
          throw new Error('Verify your email before setting a password.');
        }
      }

      const { error: passwordError } = await supabase.auth.updateUser({ password });
      if (passwordError) throw passwordError;

      localStorage.removeItem(passwordSetupUserKey);
      setIsPasswordRecovery(false);
      setShowPasswordSetup(false);
      setAuthMessage('');
      return true;
    } catch (err) {
      setAuthError(err.message || 'Could not save your password.');
      return false;
    } finally {
      setAuthBusy(false);
    }
  }

  async function handlePasswordReset(email) {
    setAuthBusy(true);
    setAuthError('');
    setAuthMessage('');
    try {
      if (!email) throw new Error('Enter your account email first.');
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${window.location.pathname}`
      });
      if (resetError) throw resetError;
      setAuthMessage(`A password reset link was sent to ${email}.`);
    } catch (err) {
      setAuthError(err.message || 'Could not request a password reset.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignOut() {
    setAuthBusy(true);
    setAuthError('');
    setAuthMessage('');
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
    } catch (err) {
      setAuthError(err.message || 'Could not sign out.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    if (!userId) return;

    setProfileBusy(true);
    setProfileError('');
    setProfileMessage('');
    try {
      const savedProfile = await saveMyProfile(userId, profileDraft);
      setProfile(savedProfile);
      setProfileDraft(savedProfile.display_name);
      setProfileMessage('Display name saved.');
      setDashboardRefreshToken((token) => token + 1);
    } catch (err) {
      setProfileError(err.message || 'Could not save your display name.');
    } finally {
      setProfileBusy(false);
    }
  }

  const closePersonalRecords = useCallback(() => {
    setShowPersonalRecords(false);
  }, []);

  function handleRetryAuth() {
    setAuthError('');
    setIsInitialising(true);
    setAuthRetryCount((count) => count + 1);
  }

  const summary = useMemo(() => {
    const prefix = monthPrefix(monthDate);
    const entries = Object.values(workoutMap).filter((day) => day.date.startsWith(prefix));
    const workoutDaysCount = entries.filter((day) => day.status === 'workout').length;

    const totalSets = monthEntries.reduce((sum, item) => sum + Number(item.sets || 0), 0);
    const totalReps = monthEntries.reduce((sum, item) => {
      if (item.entry_type === 'cardio') return sum;
      return (
        sum +
        getEntrySetDetails(item).reduce(
          (setTotal, set) => setTotal + Number(set.reps || 0),
          0
        )
      );
    }, 0);
    return {
      workoutDaysCount,
      totalSets,
      totalReps
    };
  }, [workoutMap, monthEntries, monthDate]);

  async function openDay(dateKey) {
    if (!userId) return;

    try {
      const existingDay = await getWorkoutDay(userId, dateKey);
      const entries = existingDay ? await getEntriesForDay(userId, existingDay.id) : [];

      setSelectedDate(dateKey);
      setModalDay(existingDay || { date: dateKey, status: 'empty', notes: '', workout_type: '' });
      setDayEntries(entries);
    } catch (err) {
      setError(err.message || 'Could not open this day.');
    }
  }

  async function refreshDay(dateKey) {
    const updated = await getWorkoutDay(userId, dateKey);
    const entries = updated ? await getEntriesForDay(userId, updated.id) : [];

    setModalDay(updated || { date: dateKey, status: 'empty', notes: '', workout_type: '' });
    setDayEntries(entries);
  }

  async function handleStatusChange(nextStatus, notesValue, nextWorkoutType) {
    if (!selectedDate || !userId) return;

    try {
      const savedDay = await saveWorkoutDay(userId, {
        date: selectedDate,
        status: nextStatus,
        notes: notesValue ?? modalDay?.notes ?? '',
        workout_type: nextWorkoutType ?? modalDay?.workout_type ?? ''
      });

      setModalDay(savedDay);
      setWorkoutMap((previous) => ({
        ...previous,
        [selectedDate]: savedDay
      }));

      await refreshDay(selectedDate);
      setDashboardRefreshToken((token) => token + 1);
    } catch (err) {
      setError(err.message || 'Could not save workout day status.');
    }
  }

  async function handleSaveEntry(entryPayload, nextWorkoutType) {
    if (!selectedDate || !userId) return false;

    const exerciseName = (entryPayload.exercise_name || '').trim();
    if (!exerciseName) {
      setError('Exercise name is required.');
      return false;
    }

    try {
      const savedExercise = await upsertExercise(userId, exerciseName);
      const day = await saveWorkoutDay(userId, {
        date: selectedDate,
        status: 'workout',
        notes: modalDay?.notes || '',
        workout_type: nextWorkoutType ?? modalDay?.workout_type ?? ''
      });

      await saveWorkoutEntry(userId, {
        ...entryPayload,
        day_id: day.id,
        exercise_id: savedExercise?.id || null,
        exercise_name: savedExercise?.name || exerciseName,
        weight_unit: entryPayload.weight_unit || 'kg',
        user_id: userId
      });

      const refreshedDay = await getWorkoutDay(userId, selectedDate);
      const refreshedEntries = refreshedDay ? await getEntriesForDay(userId, refreshedDay.id) : [];

      setModalDay(refreshedDay || day);
      setDayEntries(refreshedEntries);

      const days = await getVisibleDays(userId, monthDate);

      const nextMap = {};
      days.forEach((item) => {
        nextMap[item.date] = item;
      });

      setWorkoutMap(nextMap);

      const [nextRecent, nextVolume, nextMonthEntries] = await Promise.all([
        getRecentWorkoutDays(userId, 10),
        getExerciseVolume(userId),
        getEntriesForDays(userId, getMonthDayIds(days, monthDate))
      ]);

      setRecentWorkoutDays(nextRecent);
      setExerciseVolume(nextVolume);
      setMonthEntries(nextMonthEntries);
      setDashboardRefreshToken((token) => token + 1);
      return true;
    } catch (err) {
      setError(err.message || 'Could not save workout entry.');
      return false;
    }
  }

  async function handleDeleteEntry(entryId) {
    if (!entryId) return;

    try {
      await deleteWorkoutEntry(entryId);
      await refreshDay(selectedDate);

      const days = await getVisibleDays(userId, monthDate);

      const map = {};
      days.forEach((item) => {
        map[item.date] = item;
      });

      setWorkoutMap(map);

      const nextRecent = await getRecentWorkoutDays(userId, 10);
      const nextVolume = await getExerciseVolume(userId);

      setRecentWorkoutDays(nextRecent);
      setExerciseVolume(nextVolume);
      const updatedEntries = await getEntriesForDays(userId, getMonthDayIds(days, monthDate));
      setMonthEntries(updatedEntries);
      setDashboardRefreshToken((token) => token + 1);
    } catch (err) {
      setError(err.message || 'Could not delete workout entry.');
    }
  }

  const handleSearchExercises = useCallback(async (query) => {
    if (!userId) return [];
    if (!query.trim()) return [];

    try {
      const savedExercises = await searchExercises(userId, query);
      const normalizedQuery = query.trim().toLocaleLowerCase();
      const matches = exerciseLibrary.filter((exercise) =>
        exercise.name.toLocaleLowerCase().includes(normalizedQuery)
      );
      const merged = new Map(
        matches.map((exercise) => [exercise.name.toLocaleLowerCase(), exercise])
      );
      (savedExercises || []).forEach((exercise) => {
        merged.set(exercise.name.toLocaleLowerCase(), {
          ...exercise,
          category: exercise.category || 'Saved'
        });
      });
      return Array.from(merged.values()).slice(0, 10);
    } catch (err) {
      setError(err.message || 'Could not search saved exercises.');
      return [];
    }
  }, [userId]);

  const calendarCells = useMemo(
    () => getMonthDays(monthDate.getFullYear(), monthDate.getMonth()),
    [monthDate]
  );

  function handleCalendarDate(dateKey) {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getMonth() !== monthDate.getMonth() || date.getFullYear() !== monthDate.getFullYear()) {
      setMonthDate(monthStart(date));
    }
    openDay(dateKey);
  }

  function handleLogToday() {
    const today = new Date();
    setMonthDate(monthStart(today));
    openDay(formatDateKey(today));
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="app-shell">
        <section className="error-banner" role="alert">
          <h1>Connect Supabase to get started</h1>
          <p>
            The workout tracker needs Supabase to load and save your data. Copy{' '}
            <code>.env.example</code> to <code>.env</code>, fill in your Supabase
            project URL and anon key, then restart the dev server.
          </p>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Training log</p>
          <h1>Workout Tracker</h1>
        </div>

        {userId && (
          <div className="topbar-actions">
            <details className="profile-menu">
              <summary>{profile?.display_name || 'Profile'}</summary>
              <form className="profile-form" onSubmit={handleSaveProfile}>
                <label>
                  Display name
                  <input
                    type="text"
                    className="text-input"
                    minLength={1}
                    maxLength={40}
                    required
                    value={profileDraft}
                    onChange={(event) => setProfileDraft(event.target.value)}
                  />
                </label>
                {profileMessage && <p className="account-message" role="status">{profileMessage}</p>}
                {profileError && <p className="account-error" role="alert">{profileError}</p>}
                <button type="submit" className="button primary-button" disabled={profileBusy}>
                  {profileBusy ? 'Saving...' : 'Save name'}
                </button>
              </form>
            </details>
            {authUser?.is_anonymous ? (
              <button
                type="button"
                className="button primary-button"
                onClick={() => {
                  setAuthError('');
                  setAuthMessage('');
                  setGuestSignupOpen((isOpen) => !isOpen);
                }}
              >
                Sign Up
              </button>
            ) : (
              <button
                type="button"
                className="button ghost-button"
                onClick={handleSignOut}
                disabled={authBusy}
              >
                {authBusy ? 'Signing out...' : 'Sign out'}
              </button>
            )}
          </div>
        )}
      </header>

      {userId && error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      {isInitialising && !userId ? (
        <div className="loading-card">Loading workout calendar...</div>
      ) : (
        <AccountPanel
          user={authUser}
          busy={authBusy}
          message={authMessage}
          error={authError}
          recoveryMode={isPasswordRecovery}
          showPasswordSetup={showPasswordSetup}
          guestSignupOpen={guestSignupOpen}
          onLinkEmail={handleLinkEmail}
          onSignIn={handleSignIn}
          onSignInAsGuest={handleSignInAsGuest}
          onBeginEmailLink={handleStartEmailLink}
          onRetryAuth={handleRetryAuth}
          onSetPassword={handleSetPassword}
          onRequestPasswordReset={handlePasswordReset}
        />
      )}

      {userId && (
        <>
          <section className="today-action-section">
            <button type="button" className="button primary-button today-action" onClick={handleLogToday}>
              Log today's workout
            </button>
          </section>

          {isLoading ? (
            <div className="loading-card">Loading workout calendar...</div>
          ) : (
            <CalendarGrid
              cells={calendarCells}
              workoutMap={workoutMap}
              onDateClick={handleCalendarDate}
              monthTitle={getMonthTitle(monthDate)}
              selectedDate={selectedDate}
              onPreviousMonth={() =>
                setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))
              }
              onNextMonth={() =>
                setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))
              }
              onToday={() => setMonthDate(monthStart(new Date()))}
            />
          )}

          <WeeklySummary
            workoutDays={weeklyDays}
            entries={weeklyEntries}
            loading={weeklyLoading}
          />

          <Leaderboard
            rows={leaderboardRows}
            monthTitle={getMonthTitle(monthDate)}
            loading={leaderboardLoading}
            error={leaderboardError}
          />

          <MonthlyPrComparison
            rows={monthlyPrRows}
            monthTitle={getMonthTitle(monthDate)}
            loading={monthlyPrLoading}
            error={monthlyPrError}
          />

          <SummaryCards
            summary={summary}
            personalRecords={personalRecords}
            personalRecordsLoading={personalRecordsLoading}
            personalRecordsError={personalRecordsError}
            onOpenPersonalRecords={() => setShowPersonalRecords(true)}
          />

          <div className="insights-grid">
            <ExerciseChart data={exerciseVolume} />
          </div>

          <div className="bottom-grid">
            <HistoryList workoutDays={recentWorkoutDays} />
          </div>

          {selectedDate && (
            <DayDetailsModal
              selectedDate={selectedDate}
              dayRecord={modalDay}
              entries={dayEntries}
              onClose={() => {
                setSelectedDate(null);
                setModalDay(null);
                setDayEntries([]);
              }}
              onStatusChange={handleStatusChange}
              onWorkoutTypeChange={(value) =>
                handleStatusChange(modalDay?.status || 'empty', modalDay?.notes || '', value)
              }
              onSaveEntry={handleSaveEntry}
              onDeleteEntry={handleDeleteEntry}
              onSearchExercises={handleSearchExercises}
            />
          )}
          {showPersonalRecords && (
            <PersonalRecordsModal
              records={personalRecords}
              error={personalRecordsError}
              onClose={closePersonalRecords}
            />
          )}
        </>
      )}
    </div>
  );
}
