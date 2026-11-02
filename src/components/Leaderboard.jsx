export function Leaderboard({ rows = [], monthTitle, loading, error }) {
  return (
    <section className="panel-section leaderboard-section" aria-labelledby="leaderboard-title">
      <div className="section-header">
        <h3 id="leaderboard-title">Monthly Leaderboard - Workout Days</h3>
        <span>{monthTitle}</span>
      </div>
      {error ? (
        <p className="account-error" role="alert">{error}</p>
      ) : loading ? (
        <p className="empty-state" role="status">Loading leaderboard...</p>
      ) : rows.length === 0 ? (
        <p className="empty-state">No registered athletes on the leaderboard yet.</p>
      ) : (
        <ol className="leaderboard-list">
          {rows.map((row) => (
            <li
              key={`${row.rank_position}-${row.display_name}`}
              className={row.is_current_user ? 'current-user' : ''}
            >
              <span className="leaderboard-rank">{row.rank_position}</span>
              <span className="leaderboard-name">
                {row.display_name}
                {row.is_current_user && <small>You</small>}
              </span>
              <span className="leaderboard-days">
                {row.workout_days} {Number(row.workout_days) === 1 ? 'day' : 'days'}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
