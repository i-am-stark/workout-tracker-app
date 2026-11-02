export function getEntrySetDetails(entry) {
  if (Array.isArray(entry.set_details) && entry.set_details.length > 0) {
    return entry.set_details;
  }

  return Array.from({ length: Math.max(1, Number(entry.sets) || 0) }, () => ({
    reps: entry.reps ?? 0,
    weight: entry.weight ?? 0
  }));
}
