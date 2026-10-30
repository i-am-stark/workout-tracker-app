import { getRelativeDateLabel } from '../lib/dateUtils';

export function HistoryList({ entries }) {
  if (!entries.length) {
    return (
      <div className="panel-section">
        <div className="section-header">
          <h3>Recent history</h3>
        </div>
        <p className="empty-state">No workout history yet.</p>
      </div>
    );
  }

  return (
    <div className="panel-section">
      <div className="section-header">
        <h3>Recent history</h3>
      </div>

      <div className="history-list">
        {entries.map((entry) => (
          <div key={entry.id} className="history-item">
            <div>
              <strong>{entry.exercise_name}</strong>
              <p>
                {entry.sets} sets · {entry.reps} reps · {entry.weight} kg
              </p>
            </div>
            <span>{getRelativeDateLabel(entry.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
