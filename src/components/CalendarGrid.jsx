import { formatDateKey } from '../lib/dateUtils';

export function CalendarGrid({
  cells,
  workoutMap,
  onDateClick,
  monthTitle,
  selectedDate,
  onPreviousMonth,
  onNextMonth,
  onToday
}) {
  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar-panel">
      <div className="calendar-navigation">
        <button type="button" className="nav-button" aria-label="Previous month" onClick={onPreviousMonth}>
          ‹
        </button>
        <strong>{monthTitle}</strong>
        <button type="button" className="nav-button" aria-label="Next month" onClick={onNextMonth}>
          ›
        </button>
        <button type="button" className="button ghost-button" onClick={onToday}>Today</button>
      </div>
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
          const isToday = cell.key === formatDateKey(new Date());

          return (
            <button
              key={cell.key}
              type="button"
              className={`day-cell ${status} ${isCurrentMonth ? 'current-month' : 'muted-month'} ${isToday ? 'today' : ''} ${cell.key === selectedDate ? 'selected' : ''}`}
              aria-label={`${cell.key}, ${status}`}
              onClick={() => onDateClick(cell.key)}
            >
              <span className="day-number">{cell.day}</span>
              <span className={`day-status-marker ${status}`} aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <div className="calendar-legend" aria-label="Calendar status legend">
        <span><i className="workout" />Workout</span>
        <span><i className="rest" />Rest</span>
        <span><i className="skipped" />Skipped</span>
        <span><i className="empty" />No log</span>
      </div>
    </div>
  );
}
