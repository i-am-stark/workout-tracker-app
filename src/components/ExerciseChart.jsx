export function ExerciseChart({ data = [] }) {
  const maxValue = Math.max(...data.map((item) => Number(item.sets) || 0), 1);

  return (
    <div className="panel-section">
      <div className="section-header">
        <h3>Exercise focus</h3>
      </div>

      {data.length === 0 ? (
        <p className="empty-state">Log a few workouts to see your most-trained exercises.</p>
      ) : (
        <div className="exercise-chart">
          {data.map((item) => (
          <div key={item.name} className="chart-row">
            <span className="chart-label">{item.name}</span>
            <div className="chart-bar-track">
              <div
                className="chart-bar"
                style={{ width: `${(item.sets / maxValue) * 100}%` }}
              />
            </div>
            <span className="chart-value">{item.sets}</span>
          </div>
          ))}
        </div>
      )}
    </div>
  );
}
