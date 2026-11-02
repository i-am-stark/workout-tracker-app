import { useEffect, useRef, useState } from 'react';
import { ExerciseSearch } from './ExerciseSearch';
import { CARDIO_EXERCISES, WORKOUT_TYPES } from '../data/exerciseLibrary';
import { getEntrySetDetails } from '../lib/workoutEntryUtils';

function NumberStepper({ label, value, onChange, step = 1, min = 0 }) {
  const numericValue = Number(value || 0);
  const update = (next) => onChange(Math.max(min, Number(next.toFixed(2))));

  return (
    <label className="number-stepper">
      <span>{label}</span>
      <div className="number-stepper-controls">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => update(numericValue - step)}
        >
          −
        </button>
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => update(numericValue + step)}
        >
          +
        </button>
      </div>
    </label>
  );
}

export function DayDetailsModal({
  selectedDate,
  dayRecord,
  entries,
  onClose,
  onStatusChange,
  onSaveEntry,
  onDeleteEntry,
  onSearchExercises,
  onWorkoutTypeChange
}) {
  const [status, setStatus] = useState(dayRecord?.status || 'empty');
  const [notes, setNotes] = useState(dayRecord?.notes || '');
  const [workoutType, setWorkoutType] = useState(dayRecord?.workout_type || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [draftEntry, setDraftEntry] = useState({
    entry_type: dayRecord?.workout_type === 'Running' ? 'cardio' : 'strength',
    exercise_name: '',
    set_details: [{ reps: '', weight: '' }],
    weight_unit: 'kg',
    distance_km: '',
    speed_kmh: '',
    notes: ''
  });
  const noteSaveTimer = useRef(null);
  const savedNotes = useRef(dayRecord?.notes || '');
  const closeModalRef = useRef(null);

  useEffect(() => {
    const updatedNotes = dayRecord?.notes || '';
    setStatus(dayRecord?.status || 'empty');
    setWorkoutType(dayRecord?.workout_type || '');
    if (notes === savedNotes.current || notes === updatedNotes) {
      setNotes(updatedNotes);
    }
    savedNotes.current = updatedNotes;
  }, [dayRecord]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') closeModalRef.current?.();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

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
      entry_type: draftEntry.entry_type,
      exercise_name: draftEntry.exercise_name.trim(),
      set_details:
        draftEntry.entry_type === 'cardio'
          ? []
          : draftEntry.set_details.map((set) => ({
              reps: set.reps,
              weight: set.weight
            })),
      weight_unit: draftEntry.weight_unit || 'kg',
      distance_km: draftEntry.entry_type === 'cardio' ? draftEntry.distance_km : null,
      speed_kmh: draftEntry.entry_type === 'cardio' ? draftEntry.speed_kmh : null,
      notes: draftEntry.notes || ''
    }, workoutType);

    if (!saved) return;

    setEditingEntryId(null);
    setDraftEntry({
      entry_type: workoutType === 'Running' ? 'cardio' : 'strength',
      exercise_name: '',
      set_details: [{ reps: '', weight: '' }],
      weight_unit: 'kg',
      distance_km: '',
      speed_kmh: '',
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
  closeModalRef.current = closeModal;

  function selectExercise(exercise) {
    setDraftEntry((previous) => ({
      ...previous,
      exercise_name: exercise.name,
      entry_type: CARDIO_EXERCISES.has(exercise.name.toLocaleLowerCase())
        ? 'cardio'
        : previous.entry_type
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
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-editor-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Selected day</p>
            <h2 id="day-editor-title">
              {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
              })}
            </h2>
          </div>

          <button type="button" className="button ghost-button" aria-label="Close day editor" onClick={closeModal}>
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
          Workout type
          <input
            type="text"
            className="text-input"
            list="workout-type-options"
            value={workoutType}
            onChange={(event) => setWorkoutType(event.target.value)}
            onBlur={() => {
              if (workoutType !== (dayRecord?.workout_type || '')) {
                onWorkoutTypeChange(workoutType);
              }
              if (workoutType === 'Running' && !editingEntryId) {
                setDraftEntry((previous) => ({
                  ...previous,
                  entry_type: 'cardio'
                }));
              }
            }}
            placeholder="Choose or enter a workout type"
          />
          <datalist id="workout-type-options">
            {WORKOUT_TYPES.map((type) => <option key={type} value={type} />)}
          </datalist>
        </label>

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
          <h3>{editingEntryId ? 'Edit workout entry' : 'Add workout entry'}</h3>

          <ExerciseSearch
            value={searchQuery}
            onChange={setSearchQuery}
            suggestions={suggestions}
            onSelectSuggestion={selectExercise}
            onCreateNew={createNewExercise}
          />

          <label className="form-label">
            Entry type
            <select
              className="text-input"
              value={draftEntry.entry_type}
              onChange={(event) =>
                setDraftEntry((previous) => ({
                  ...previous,
                  entry_type: event.target.value
                }))
              }
            >
              <option value="strength">Strength</option>
              <option value="cardio">Cardio / running</option>
            </select>
          </label>

          <div className="entry-form-grid">
            <label className="form-label">
              Exercise or activity
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
            </label>
            {draftEntry.entry_type === 'strength' ? (
              <>
                <div className="set-details-list">
                  {draftEntry.set_details.map((set, index) => (
                    <div className="set-details-row" key={index}>
                      <strong>Set {index + 1}</strong>
                      <label>
                        Reps
                        <input
                          className="text-input"
                          type="number"
                          min="0"
                          step="1"
                          value={set.reps}
                          onChange={(event) =>
                            setDraftEntry((previous) => ({
                              ...previous,
                              set_details: previous.set_details.map((item, setIndex) =>
                                setIndex === index
                                  ? { ...item, reps: event.target.value }
                                  : item
                              )
                            }))
                          }
                        />
                      </label>
                      <label>
                        Weight
                        <input
                          className="text-input"
                          type="number"
                          min="0"
                          step="0.5"
                          value={set.weight}
                          onChange={(event) =>
                            setDraftEntry((previous) => ({
                              ...previous,
                              set_details: previous.set_details.map((item, setIndex) =>
                                setIndex === index
                                  ? { ...item, weight: event.target.value }
                                  : item
                              )
                            }))
                          }
                        />
                      </label>
                      {draftEntry.set_details.length > 1 && (
                        <button
                          type="button"
                          className="button danger-button remove-set-button"
                          aria-label={`Remove set ${index + 1}`}
                          onClick={() =>
                            setDraftEntry((previous) => ({
                              ...previous,
                              set_details: previous.set_details.filter(
                                (_, setIndex) => setIndex !== index
                              )
                            }))
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="button ghost-button add-set-button"
                    onClick={() =>
                      setDraftEntry((previous) => ({
                        ...previous,
                        set_details: [...previous.set_details, { reps: '', weight: '' }]
                      }))
                    }
                  >
                    + Add set
                  </button>
                </div>
                <label className="form-label">
                  Weight unit
                  <select
                    className="text-input"
                    value={draftEntry.weight_unit}
                    onChange={(event) =>
                      setDraftEntry((previous) => ({
                        ...previous,
                        weight_unit: event.target.value
                      }))
                    }
                  >
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                    <option value="bodyweight">Bodyweight</option>
                  </select>
                </label>
              </>
            ) : (
              <>
                <NumberStepper
                  label="Distance (km)"
                  step={0.1}
                  value={draftEntry.distance_km}
                  onChange={(value) =>
                    setDraftEntry((previous) => ({ ...previous, distance_km: value }))
                  }
                />
                <NumberStepper
                  label="Speed (km/h)"
                  step={0.1}
                  value={draftEntry.speed_kmh}
                  onChange={(value) =>
                    setDraftEntry((previous) => ({ ...previous, speed_kmh: value }))
                  }
                />
              </>
            )}
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
                    entry_type: workoutType === 'Running' ? 'cardio' : 'strength',
                    exercise_name: '',
                    set_details: [{ reps: '', weight: '' }],
                    weight_unit: 'kg',
                    distance_km: '',
                    speed_kmh: '',
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
                        {entry.entry_type === 'cardio'
                          ? `${entry.distance_km} km · ${entry.speed_kmh} km/h`
                          : getEntrySetDetails(entry)
                              .map(
                                (set, index) =>
                                  `Set ${index + 1}: ${set.reps} reps × ${set.weight} ${entry.weight_unit || 'kg'}`
                              )
                              .join(' · ')}
                      </div>
                    </div>

                    <div className="entry-actions">
                      <button
                        type="button"
                        className="button ghost-button"
                        onClick={() => {
                          setEditingEntryId(entry.id);
                          setDraftEntry({
                            entry_type: entry.entry_type || 'strength',
                            exercise_name: entry.exercise_name,
                            set_details: getEntrySetDetails(entry).map((set) => ({
                              reps: set.reps ?? '',
                              weight: set.weight ?? ''
                            })),
                            weight_unit: entry.weight_unit || 'kg',
                            distance_km: entry.distance_km ?? '',
                            speed_kmh: entry.speed_kmh ?? '',
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
