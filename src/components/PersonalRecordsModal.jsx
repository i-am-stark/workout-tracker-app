import { useEffect } from 'react';

const formatWeight = (weightKg) => `${weightKg.toFixed(1)} kg`;

export function PersonalRecordsModal({ records = [], error, onClose }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="pr-modal panel-section"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby="personal-records-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="section-header">
          <div>
            <p className="eyebrow">All time</p>
            <h2 id="personal-records-title">Highest weight by exercise</h2>
          </div>
          <button type="button" className="button ghost-button" onClick={onClose}>
            Close
          </button>
        </div>

        {error ? (
          <p className="account-error" role="alert">{error}</p>
        ) : records.length === 0 ? (
          <p className="empty-state">
            No weighted strength records yet. Log a weighted strength entry to start tracking PRs.
          </p>
        ) : (
          <ol className="pr-list">
            {records.map((record) => (
              <li key={record.exercise}>
                <span>{record.exercise}</span>
                <strong>{formatWeight(record.weightKg)}</strong>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
