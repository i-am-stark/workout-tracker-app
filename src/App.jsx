import { useEffect, useMemo, useRef, useState } from 'react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { getWorkoutDaysForMonth, saveWorkoutDay, getWorkoutDay } from './api/workoutDays';
import { searchExercises, upsertExercise } from './api/exercises';
import { getEntriesForDay, getEntriesForDays, getRecentEntries, getExerciseVolume, saveWorkoutEntry, deleteWorkoutEntry } from './api/workoutEntries';
import { CalendarGrid } from './components/CalendarGrid';
import { DayDetailsModal } from './components/DayDetailsModal';
import { SummaryCards } from './components/SummaryCards';
import { WeeklySummary } from './components/WeeklySummary';
import { HistoryList } from './components/HistoryList';
import { ExerciseChart } from './components/ExerciseChart';
import { AccountPanel } from './components/AccountPanel';
import { formatDateKey, getMonthDays, getMonthTitle } from './lib/dateUtils';

const monthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const monthEnd = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
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
  const [recentEntries, setRecentEntries] = useState([]);
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
      setRecentEntries([]);
      setExerciseVolume([]);
      setSelectedDate(null);
      setModalDay(null);
      setDayEntries([]);
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

        const start = monthStart(monthDate);
        const end = monthEnd(monthDate);

        const days = await getWorkoutDaysForMonth(
          userId,
          formatDateKey(start),
          formatDateKey(end)
        );
        const [entries, recent, volume] = await Promise.all([
          getEntriesForDays(userId, days.map((day) => day.id)),
          getRecentEntries(userId, 10),
          getExerciseVolume(userId)
        ]);

        const map = {};
        days.forEach((day) => {
          map[day.date] = day;
        });

        if (active) {
          setWorkoutMap(map);
          setMonthEntries(entries);
          setRecentEntries(recent || []);
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

  async function handleLinkEmail(email) {
    setAuthBusy(true);
    setAuthError('');
    setAuthMessage('');
    try {
      if (!authUser?.is_anonymous) {
        throw new Error('Email linking is only available from the anonymous account that owns these records.');
      }

      const { error: linkError } = await supabase.auth.updateUser(
        { email },
        { emailRedirectTo: `${window.location.origin}${window.location.pathname}` }
      );
      if (linkError) throw linkError;

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

  function handleRetryAuth() {
    setAuthError('');
    setIsInitialising(true);
    setAuthRetryCount((count) => count + 1);
  }

  const summary = useMemo(() => {
    const monthPrefix = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    const entries = Object.values(workoutMap).filter((day) => day.date.startsWith(monthPrefix));
    const workoutDaysCount = entries.filter((day) => day.status === 'workout').length;

    const totalSets = monthEntries.reduce((sum, item) => sum + Number(item.sets || 0), 0);
    const totalReps = monthEntries.reduce(
      (sum, item) => sum + Number(item.sets || 0) * Number(item.reps || 0),
      0
    );
    const trainingVolume = monthEntries.reduce((sum, item) => {
      if (item.weight_unit === 'bodyweight') return sum;

      const weight = Number(item.weight || 0);
      const weightInKg = item.weight_unit === 'lb' ? weight * 0.45359237 : weight;
      return sum + Number(item.sets || 0) * Number(item.reps || 0) * weightInKg;
    }, 0);

    return {
      workoutDaysCount,
      totalSets,
      totalReps,
      trainingVolume
    };
  }, [workoutMap, monthEntries, monthDate]);

  async function openDay(dateKey) {
    if (!userId) return;

    try {
      const existingDay = await getWorkoutDay(userId, dateKey);
      const entries = existingDay ? await getEntriesForDay(userId, existingDay.id) : [];

      setSelectedDate(dateKey);
      setModalDay(existingDay || { date: dateKey, status: 'empty', notes: '' });
      setDayEntries(entries);
    } catch (err) {
      setError(err.message || 'Could not open this day.');
    }
  }

  async function refreshDay(dateKey) {
    const updated = await getWorkoutDay(userId, dateKey);
    const entries = updated ? await getEntriesForDay(userId, updated.id) : [];

    setModalDay(updated || { date: dateKey, status: 'empty', notes: '' });
    setDayEntries(entries);
  }

  async function handleStatusChange(nextStatus, notesValue) {
    if (!selectedDate || !userId) return;

    try {
      const savedDay = await saveWorkoutDay(userId, {
        date: selectedDate,
        status: nextStatus,
        notes: notesValue ?? modalDay?.notes ?? ''
      });

      setModalDay(savedDay);
      setWorkoutMap((previous) => ({
        ...previous,
        [selectedDate]: savedDay
      }));

      await refreshDay(selectedDate);
    } catch (err) {
      setError(err.message || 'Could not save workout day status.');
    }
  }

  async function handleSaveEntry(entryPayload) {
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
        notes: modalDay?.notes || ''
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

      const start = monthStart(monthDate);
      const end = monthEnd(monthDate);

      const days = await getWorkoutDaysForMonth(
        userId,
        formatDateKey(start),
        formatDateKey(end)
      );

      const nextMap = {};
      days.forEach((item) => {
        nextMap[item.date] = item;
      });

      setWorkoutMap(nextMap);

      const [nextRecent, nextVolume, nextMonthEntries] = await Promise.all([
        getRecentEntries(userId, 10),
        getExerciseVolume(userId),
        getEntriesForDays(userId, days.map((item) => item.id))
      ]);

      setRecentEntries(nextRecent);
      setExerciseVolume(nextVolume);
      setMonthEntries(nextMonthEntries);
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

      const start = monthStart(monthDate);
      const end = monthEnd(monthDate);

      const days = await getWorkoutDaysForMonth(
        userId,
        formatDateKey(start),
        formatDateKey(end)
      );

      const map = {};
      days.forEach((item) => {
        map[item.date] = item;
      });

      setWorkoutMap(map);

      const nextRecent = await getRecentEntries(userId, 10);
      const nextVolume = await getExerciseVolume(userId);

      setRecentEntries(nextRecent);
      setExerciseVolume(nextVolume);
      const updatedEntries = await getEntriesForDays(userId, days.map((item) => item.id));
      setMonthEntries(updatedEntries);
    } catch (err) {
      setError(err.message || 'Could not delete workout entry.');
    }
  }

  async function handleSearchExercises(query) {
    if (!userId) return [];
    if (!query.trim()) return [];

    const results = await searchExercises(userId, query);
    return results || [];
  }

  const calendarCells = useMemo(
    () => getMonthDays(monthDate.getFullYear(), monthDate.getMonth()),
    [monthDate]
  );

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
            <div className="month-controls">
              <button
                type="button"
                className="nav-button"
                onClick={() =>
                  setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))
                }
              >
                Prev
              </button>

              <div className="month-label">{getMonthTitle(monthDate)}</div>

              <button
                type="button"
                className="nav-button"
                onClick={() =>
                  setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))
                }
              >
                Next
              </button>
            </div>
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
          <SummaryCards summary={summary} />

          <div className="insights-grid">
            <WeeklySummary workoutMap={workoutMap} monthEntries={monthEntries} />
            <ExerciseChart data={exerciseVolume} />
          </div>

          {isLoading ? (
            <div className="loading-card">Loading workout calendar...</div>
          ) : (
            <CalendarGrid
              cells={calendarCells}
              workoutMap={workoutMap}
              onDateClick={openDay}
            />
          )}

          <div className="bottom-grid">
            <HistoryList entries={recentEntries} />
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
              onSaveEntry={handleSaveEntry}
              onDeleteEntry={handleDeleteEntry}
              onSearchExercises={handleSearchExercises}
            />
          )}
        </>
      )}
    </div>
  );
}
