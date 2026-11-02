export function HistoryList({ workoutDays = [] }) {
  if (!workoutDays.length) {
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
        {workoutDays.map((day) => (
          <div key={day.id} className="history-item">
            <div>
              <strong>{day.workout_type || 'Workout'}</strong>
            </div>
            <time dateTime={day.date}>
              {new Date(`${day.date}T00:00:00`).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </time>
          </div>
        ))}
      </div>
    </div>
  );
}
