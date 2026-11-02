export function SummaryCards({
  summary,
  personalRecords,
  personalRecordsLoading,
  personalRecordsError,
  onOpenPersonalRecords
}) {
  const topRecord = personalRecords[0];
  const cards = [
    { label: 'Workout days this month', value: summary.workoutDaysCount ?? 0 },
    { label: 'Sets this month', value: summary.totalSets ?? 0 },
    { label: 'Reps this month', value: summary.totalReps ?? 0 },
  ];

  return (
    <div className="summary-grid">
      {cards.map((card) => (
        <div key={card.label} className="summary-card">
          <span>{card.label}</span>
          <strong>{card.value}</strong>
        </div>
      ))}
      <button
        type="button"
        className="summary-card personal-record-card"
        onClick={onOpenPersonalRecords}
        aria-label="View all-time highest-weight personal records"
      >
        <span>Top weight PR</span>
        {personalRecordsLoading ? (
          <strong>Loading...</strong>
        ) : personalRecordsError ? (
          <strong>Unavailable</strong>
        ) : topRecord ? (
          <>
            <strong>{topRecord.weightKg.toFixed(1)} kg</strong>
            <span>{topRecord.exercise}</span>
          </>
        ) : (
          <strong>No PRs yet</strong>
        )}
        {personalRecordsError && <small role="alert">{personalRecordsError}</small>}
        <small>Tap to view all exercises</small>
      </button>
    </div>
  );
}
