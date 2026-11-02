import { getPastDays } from '../lib/dateUtils';

export function WeeklySummary({ workoutDays, entries, loading }) {
  const dateByDayId = new Map((workoutDays || []).map((day) => [day.id, day.date]));
  const daysByDate = new Map((workoutDays || []).map((day) => [day.date, day]));
  const items = getPastDays(7).map(({ date, label }) => {
    const day = daysByDate.get(date);
    const volume = (entries || []).reduce((sum, entry) => {
      if (entry.entry_type === 'cardio' || dateByDayId.get(entry.day_id) !== date) {
        return sum;
      }
      return sum + Number(entry.sets || 0);
    }, 0);

    return {
      key: date,
      label,
      status: day?.status || 'empty',
      volume
    };
  });

  const totalWorkoutDays = items.filter((item) => item.status === 'workout').length;
  const totalVolume = items.reduce((sum, item) => sum + item.volume, 0);

  return (
    <div className="panel-section">
      <div className="section-header">
        <h3>Weekly Summary</h3>
        <span>{loading ? 'Loading...' : `${totalWorkoutDays} active days`}</span>
      </div>

      <div className="weekly-bars">
        {items.map((item) => (
          <div key={item.key} className="weekly-bar-wrap">
            <span className="day-label">{item.label}</span>
            <div className={`weekly-bar ${item.status}`}>
              <span
                style={{ height: `${Math.min(100, Math.max(item.volume * 8, item.status === 'workout' ? 20 : 8))}%` }}
                title={`${item.volume} sets`}
              />
            </div>
            <small>{item.volume}</small>
          </div>
        ))}
      </div>

      <div className="weekly-footer">
        <strong>{totalVolume}</strong>
        <span>total sets this week</span>
      </div>
    </div>
  );
}
