export function CalendarGrid({ cells, workoutMap, onDateClick }) {
  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar-panel">
      <div className="calendar-header-grid">
        {weekdayLabels.map((label) => (
          <div key={label} className="weekday-label">
            {label}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((cell) => {
          const record = workoutMap[cell.key] || null;
          const status = record?.status || 'empty';
          const isCurrentMonth = cell.inCurrentMonth;

          return (
            <button
              key={cell.key}
              type="button"
              className={`day-cell ${status} ${isCurrentMonth ? 'current-month' : 'muted-month'}`}
              onClick={() => onDateClick(cell.key)}
            >
              <span className="day-number">{cell.day}</span>
              <span className="day-status">{status}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
