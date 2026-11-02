import { useEffect, useState } from 'react';

export function ExerciseSearch({
  value,
  onChange,
  suggestions,
  onSelectSuggestion,
  onCreateNew
}) {
  const [query, setQuery] = useState(value || '');
  const [selectedName, setSelectedName] = useState('');

  useEffect(() => {
    setQuery(value || '');
    if (value !== selectedName) setSelectedName('');
  }, [value]);

  function handleInput(event) {
    const nextValue = event.target.value;
    setQuery(nextValue);
    setSelectedName('');
    onChange(nextValue);
  }

  const hasSelectedSuggestion =
    selectedName && query.trim().toLocaleLowerCase() === selectedName.toLocaleLowerCase();

  return (
    <div className="exercise-search-wrap">
      <label className="exercise-search-label">
        Search exercise library
        <input
          value={query}
          onChange={handleInput}
          className="text-input"
          placeholder="e.g. Bench press"
          aria-label="Search exercises"
          autoComplete="off"
          spellCheck="false"
        />
      </label>

      {!hasSelectedSuggestion && suggestions && suggestions.length > 0 && (
        <div className="suggestion-list" role="listbox" aria-label="Exercise suggestions">
          {suggestions.map((exercise) => (
            <button
              key={exercise.id || exercise.name}
              type="button"
              className="suggestion-item"
              role="option"
              aria-selected={false}
              onClick={() => {
                setQuery(exercise.name);
                setSelectedName(exercise.name);
                onSelectSuggestion(exercise);
              }}
            >
              <span>{exercise.name}</span>
              <small>{exercise.category || 'Saved'}</small>
            </button>
          ))}
        </div>
      )}

      {query.trim() && !hasSelectedSuggestion && (
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setSelectedName(query.trim());
            onCreateNew(query.trim());
          }}
        >
          Add custom exercise: {query.trim()}
        </button>
      )}
    </div>
  );
}
