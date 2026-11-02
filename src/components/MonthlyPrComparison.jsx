import { useEffect, useMemo, useState } from 'react';

export function MonthlyPrComparison({ rows, monthTitle, loading, error }) {
  const [showAllUsers, setShowAllUsers] = useState(false);
  const users = useMemo(() => {
    const userMap = new Map();
    rows.forEach((row) => {
      const key = row.user_position;
      if (!userMap.has(key)) {
        userMap.set(key, {
          key,
          rank: row.rank_position,
          displayName: row.display_name,
          records: []
        });
      }

      if (row.exercise_name && row.weight_kg != null) {
        userMap.get(key).records.push({
          exercise: row.exercise_name,
          weightKg: Number(row.weight_kg)
        });
      }
    });
    return Array.from(userMap.values());
  }, [rows]);

  useEffect(() => {
    setShowAllUsers(false);
  }, [monthTitle]);

  return (
    <section className="panel-section monthly-pr-comparison" aria-labelledby="monthly-pr-title">
      <div className="section-header">
        <div>
          <h3 id="monthly-pr-title">Monthly Comparison - PR</h3>
          <span>Top monthly workout-day athletes · {monthTitle} · Top 5 all-time lifts per athlete</span>
        </div>
      </div>

      {error ? (
        <p className="account-error" role="alert">{error}</p>
      ) : loading ? (
        <p className="empty-state" role="status">Loading PR comparison...</p>
      ) : users.length === 0 ? (
        <p className="empty-state">No registered athletes to compare yet.</p>
      ) : (
        <>
          <div className="pr-comparison-grid">
            {users.map((user, index) => (
              <article
                className={`pr-athlete-card${index > 0 && !showAllUsers ? ' collapsed' : ''}`}
                key={user.key}
              >
                <div className="pr-athlete-heading">
                  <span className="pr-athlete-rank">#{user.rank}</span>
                  <h4>{user.displayName}</h4>
                </div>
                {user.records.length > 0 ? (
                  <ol className="pr-athlete-records">
                    {user.records.map((record) => (
                      <li key={record.exercise}>
                        <span>{record.exercise}</span>
                        <strong>{record.weightKg.toFixed(1)} kg</strong>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="empty-state">No weighted PRs logged.</p>
                )}
              </article>
            ))}
          </div>
          {users.length > 1 && (
            <button
              type="button"
              className="button ghost-button pr-comparison-toggle"
              aria-expanded={showAllUsers}
              onClick={() => setShowAllUsers((shown) => !shown)}
            >
              {showAllUsers ? 'Show fewer athletes' : `Show all ${users.length} athletes`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
