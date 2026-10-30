import { formatDateKey } from '../lib/dateUtils';

export function WeeklySummary({ workoutMap, monthEntries }) {
  const items = [];
  const dateByDayId = new Map(
    Object.values(workoutMap).map((dayRecord) => [dayRecord.id, dayRecord.date])
  );

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);

    const key = formatDateKey(date);
    const dayRecord = workoutMap[key];
    const dayStatus = dayRecord ? dayRecord.status : 'empty';

    const entriesToday = monthEntries.filter(
      (entry) => dateByDayId.get(entry.day_id) === key
    );

    const volume = entriesToday.reduce((sum, entry) => sum + Number(entry.sets || 0), 0);

    items.push({
      key,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      status: dayStatus,
      volume
    });
  }

  const totalWorkoutDays = items.filter((item) => item.status === 'workout').length;
  const totalVolume = items.reduce((sum, item) => sum + item.volume, 0);

  return (
    <div className="panel-section">
      <div className="section-header">
        <h3>Weekly Summary</h3>
        <span>{totalWorkoutDays} active days</span>
      </div>

      <div className="weekly-bars">
        {items.map((item) => (
          <div key={item.key} className="weekly-bar-wrap">
            <span className="day-label">{item.label}</span>
            <div className={`weekly-bar ${item.status}`}>
              <span style={{ height: `${Math.max(item.volume * 8, item.status === 'workout' ? 20 : 8)}px` }} />
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
