export function SummaryCards({ summary }) {
  const cards = [
    { label: 'Workout days this month', value: summary.workoutDaysCount },
    { label: 'Sets this month', value: summary.totalSets },
    { label: 'Reps this month', value: summary.totalReps },
    { label: 'Weighted volume this month', value: `${summary.trainingVolume.toFixed(1)} kg·reps` }
  ];

  return (
    <div className="summary-grid">
      {cards.map((card) => (
        <div
          key={card.label}
          className="summary-card"
          title={
            card.label.startsWith('Weighted volume')
              ? 'Sets × reps × load; pounds are converted to kilograms, bodyweight entries are excluded.'
              : undefined
          }
        >
          <span>{card.label}</span>
          <strong>{card.value}</strong>
        </div>
      ))}
    </div>
  );
}
