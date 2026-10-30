import { useState } from 'react';

export function AccountPanel({
  user,
  busy,
  message,
  error,
  recoveryMode,
  showPasswordSetup,
  guestSignupOpen,
  onLinkEmail,
  onSignIn,
  onSignInAsGuest,
  onBeginEmailLink,
  onRetryAuth,
  onSetPassword,
  onRequestPasswordReset
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function submitSignIn(event) {
    event.preventDefault();
    await onSignIn(email.trim(), password);
  }

  async function submitLinkEmail(event) {
    event.preventDefault();
    const linked = await onLinkEmail(email.trim());
    if (linked) setEmail('');
  }

  async function submitPassword(event) {
    event.preventDefault();
    if (password.length < 8 || password !== confirmPassword) return;

    const saved = await onSetPassword(password);
    if (saved) {
      setPassword('');
      setConfirmPassword('');
    }
  }

  if (recoveryMode || showPasswordSetup) {
    return (
      <section className="account-panel" aria-labelledby="account-panel-title">
        <div className="account-panel-heading">
          <div>
            <p className="eyebrow">Account security</p>
            <h2 id="account-panel-title">
              {recoveryMode ? 'Choose a new password' : 'Set your account password'}
            </h2>
          </div>
        </div>
        {message && <p className="account-message" role="status">{message}</p>}
        {error && <p className="account-error" role="alert">{error}</p>}
        <p className="account-help">
          {recoveryMode
            ? 'Choose a new password to regain access to your account.'
            : 'Your email is verified. Set a password so you can sign in from other devices.'}
        </p>
        <form className="account-form" onSubmit={submitPassword}>
          <label>
            Password
            <input
              type="password"
              className="text-input"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <label>
            Confirm password
            <input
              type="password"
              className="text-input"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
          {password && confirmPassword && password !== confirmPassword && (
            <p className="account-error" role="alert">Passwords do not match.</p>
          )}
          <button
            type="submit"
            className="button primary-button"
            disabled={busy || password.length < 8 || password !== confirmPassword}
          >
            {busy ? 'Saving...' : 'Save password'}
          </button>
        </form>
      </section>
    );
  }

  if (user?.is_anonymous) {
    if (!guestSignupOpen) return null;

    return (
      <section className="account-panel" aria-labelledby="account-panel-title">
        <div className="account-panel-heading">
          <div>
            <p className="eyebrow">Guest account</p>
            <h2 id="account-panel-title">Sign up to keep your workouts</h2>
          </div>
        </div>
        {message && <p className="account-message" role="status">{message}</p>}
        {error && <p className="account-error" role="alert">{error}</p>}
        <p className="account-help">
          Link an email to this guest account to keep access to its workout history on other
          browsers and devices.
        </p>
        <form className="account-form" onSubmit={submitLinkEmail}>
          <label>
            Email
            <input
              type="email"
              className="text-input"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <button type="submit" className="button primary-button" disabled={busy}>
            {busy ? 'Sending...' : 'Link email'}
          </button>
        </form>
        <p className="account-help">
          Confirm the email from this browser. You’ll then be prompted to set a password.
        </p>
      </section>
    );
  }

  if (user) return null;

  return (
    <section className="account-panel login-panel" aria-labelledby="account-panel-title">
      <div className="account-panel-heading">
        <div>
          <p className="eyebrow">Workout Tracker</p>
          <h2 id="account-panel-title">Log in</h2>
        </div>
      </div>
      {message && <p className="account-message" role="status">{message}</p>}
      {error && <p className="account-error" role="alert">{error}</p>}
      <form className="account-form login-form" onSubmit={submitSignIn}>
        <label>
          Email
          <input
            type="email"
            className="text-input"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            className="text-input"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button type="submit" className="button primary-button" disabled={busy}>
          {busy ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      <button
        type="button"
        className="account-text-button"
        onClick={() => onRequestPasswordReset(email.trim())}
        disabled={busy || !email.trim()}
      >
        Forgot password?
      </button>
      {error && onRetryAuth && (
        <button
          type="button"
          className="account-text-button"
          onClick={onRetryAuth}
          disabled={busy}
        >
          Retry connection
        </button>
      )}
      <div className="login-divider"><span>or</span></div>
      <div className="login-options">
        <button
          type="button"
          className="button ghost-button"
          onClick={onBeginEmailLink}
          disabled={busy}
        >
          Link Email
        </button>
        <button
          type="button"
          className="button ghost-button"
          onClick={onSignInAsGuest}
          disabled={busy}
        >
          {busy ? 'Please wait...' : 'Sign in as guest'}
        </button>
      </div>
      <p className="account-help">
        Link Email starts a guest session, then lets you attach an email to that account.
      </p>
    </section>
  );
}
