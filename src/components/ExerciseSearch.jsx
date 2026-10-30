import { useEffect, useState } from 'react';

export function ExerciseSearch({
  value,
  onChange,
  suggestions,
  onSelectSuggestion,
  onCreateNew
}) {
  const [query, setQuery] = useState(value || '');

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  function handleInput(event) {
    const nextValue = event.target.value;
    setQuery(nextValue);
    onChange(nextValue);
  }

  return (
    <div className="exercise-search-wrap">
      <input
        value={query}
        onChange={handleInput}
        className="text-input"
        placeholder="Search exercises"
      />

      {suggestions && suggestions.length > 0 && (
        <div className="suggestion-list">
          {suggestions.map((exercise) => (
            <button
              key={exercise.id || exercise.name}
              type="button"
              className="suggestion-item"
              onClick={() => {
                setQuery(exercise.name);
                onSelectSuggestion(exercise);
              }}
            >
              {exercise.name}
            </button>
          ))}
        </div>
      )}

      {query.trim() && (
        <button
          type="button"
          className="text-button"
          onClick={() => onCreateNew(query.trim())}
        >
          Add new exercise: {query.trim()}
        </button>
      )}
    </div>
  );
}
