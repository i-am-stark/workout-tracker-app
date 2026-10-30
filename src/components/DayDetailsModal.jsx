import { useEffect, useRef, useState } from 'react';
import { ExerciseSearch } from './ExerciseSearch';

export function DayDetailsModal({
  selectedDate,
  dayRecord,
  entries,
  onClose,
  onStatusChange,
  onSaveEntry,
  onDeleteEntry,
  onSearchExercises
}) {
  const [status, setStatus] = useState(dayRecord?.status || 'empty');
  const [notes, setNotes] = useState(dayRecord?.notes || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [draftEntry, setDraftEntry] = useState({
    exercise_name: '',
    sets: 0,
    reps: 0,
    weight: 0,
    notes: ''
  });
  const noteSaveTimer = useRef(null);
  const savedNotes = useRef(dayRecord?.notes || '');

  useEffect(() => {
    const updatedNotes = dayRecord?.notes || '';
    setStatus(dayRecord?.status || 'empty');
    if (notes === savedNotes.current || notes === updatedNotes) {
      setNotes(updatedNotes);
    }
    savedNotes.current = updatedNotes;
  }, [dayRecord]);

  useEffect(() => {
    if (notes === savedNotes.current) return undefined;

    noteSaveTimer.current = setTimeout(() => {
      savedNotes.current = notes;
      onStatusChange(status, notes);
    }, 500);

    return () => clearTimeout(noteSaveTimer.current);
  }, [notes]);

  useEffect(() => {
    let ignore = false;

    async function loadResults() {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }

      const results = await onSearchExercises(searchQuery);
      if (!ignore) setSuggestions(results);
    }

    loadResults();

    return () => {
      ignore = true;
    };
  }, [searchQuery, onSearchExercises]);

  async function submitDraft() {
    if (!draftEntry.exercise_name.trim()) {
      return;
    }

    const saved = await onSaveEntry({
      ...(editingEntryId ? { id: editingEntryId } : {}),
      exercise_name: draftEntry.exercise_name.trim(),
      sets: Number(draftEntry.sets || 0),
      reps: Number(draftEntry.reps || 0),
      weight: Number(draftEntry.weight || 0),
      notes: draftEntry.notes || ''
    });

    if (!saved) return;

    setEditingEntryId(null);
    setDraftEntry({
      exercise_name: '',
      sets: 0,
      reps: 0,
      weight: 0,
      notes: ''
    });
    setSearchQuery('');
    setSuggestions([]);
  }

  function closeModal() {
    clearTimeout(noteSaveTimer.current);
    if (notes !== savedNotes.current) {
      savedNotes.current = notes;
      onStatusChange(status, notes);
    }
    onClose();
  }

  function selectExercise(exercise) {
    setDraftEntry((previous) => ({
      ...previous,
      exercise_name: exercise.name
    }));
    setSearchQuery(exercise.name);
    setSuggestions([]);
  }

  function createNewExercise(name) {
    setDraftEntry((previous) => ({
      ...previous,
      exercise_name: name
    }));
    setSearchQuery(name);
    setSuggestions([]);
  }

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Selected day</p>
            <h2>{selectedDate}</h2>
          </div>

          <button type="button" className="button ghost-button" onClick={closeModal}>
            Close
          </button>
        </div>

        <div className="pill-row">
          {['empty', 'workout', 'rest', 'skipped'].map((option) => (
            <button
              key={option}
              type="button"
              className={`status-pill ${status === option ? 'active' : ''} ${option}`}
              onClick={() => {
                clearTimeout(noteSaveTimer.current);
                savedNotes.current = notes;
                setStatus(option);
                onStatusChange(option, notes);
              }}
            >
              {option}
            </button>
          ))}
        </div>

        <label className="form-label">
          Notes
          <textarea
            className="text-area"
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
            }}
          />
        </label>

        <div className="section-block">
          <h3>Add workout</h3>

          <ExerciseSearch
            value={searchQuery}
            onChange={setSearchQuery}
            suggestions={suggestions}
            onSelectSuggestion={selectExercise}
            onCreateNew={createNewExercise}
          />

          <div className="entry-form-grid">
            <input
              type="text"
              className="text-input"
              value={draftEntry.exercise_name}
              onChange={(event) =>
                setDraftEntry((previous) => ({
                  ...previous,
                  exercise_name: event.target.value
                }))
              }
              placeholder="Exercise name"
            />
            <input
              type="number"
              min="0"
              className="text-input"
              value={draftEntry.sets}
              onChange={(event) =>
                setDraftEntry((previous) => ({
                  ...previous,
                  sets: event.target.value
                }))
              }
              placeholder="Sets"
            />
            <input
              type="number"
              min="0"
              className="text-input"
              value={draftEntry.reps}
              onChange={(event) =>
                setDraftEntry((previous) => ({
                  ...previous,
                  reps: event.target.value
                }))
              }
              placeholder="Reps"
            />
            <input
              type="number"
              min="0"
              step="0.5"
              className="text-input"
              value={draftEntry.weight}
              onChange={(event) =>
                setDraftEntry((previous) => ({
                  ...previous,
                  weight: event.target.value
                }))
              }
              placeholder="Weight"
            />
          </div>

          <textarea
            className="text-area"
            value={draftEntry.notes}
            onChange={(event) =>
              setDraftEntry((previous) => ({
                ...previous,
                notes: event.target.value
              }))
            }
            placeholder="Workout notes"
          />

          <div className="form-actions">
            <button type="button" className="button primary-button" onClick={submitDraft}>
              {editingEntryId ? 'Update entry' : 'Save entry'}
            </button>
            {editingEntryId && (
              <button
                type="button"
                className="button ghost-button"
                onClick={() => {
                  setEditingEntryId(null);
                  setDraftEntry({
                    exercise_name: '',
                    sets: 0,
                    reps: 0,
                    weight: 0,
                    notes: ''
                  });
                }}
              >
                Cancel edit
              </button>
            )}
          </div>
        </div>

        <div className="section-block">
          <h3>Logged entries</h3>

          {entries.length === 0 ? (
            <p className="empty-state">No workouts logged for this day yet.</p>
          ) : (
            <div className="entry-list">
              {entries.map((entry) => (
                <div key={entry.id} className="entry-card">
                  <div className="entry-header-row">
                    <div>
                      <strong>{entry.exercise_name}</strong>
                      <div className="entry-meta">
                        {entry.sets} sets · {entry.reps} reps · {entry.weight} kg
                      </div>
                    </div>

                    <div className="entry-actions">
                      <button
                        type="button"
                        className="button ghost-button"
                        onClick={() => {
                          setEditingEntryId(entry.id);
                          setDraftEntry({
                            exercise_name: entry.exercise_name,
                            sets: entry.sets,
                            reps: entry.reps,
                            weight: entry.weight,
                            notes: entry.notes || ''
                          });
                          setSearchQuery(entry.exercise_name);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="button danger-button"
                        onClick={() => onDeleteEntry(entry.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {entry.notes && <p className="entry-notes">{entry.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
