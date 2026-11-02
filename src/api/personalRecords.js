import { supabase } from '../lib/supabase';

export async function getPersonalRecords(userId) {
  const pageSize = 500;
  const entries = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('workout_entries')
      .select('exercise_name, weight, weight_unit')
      .eq('user_id', userId)
      .eq('entry_type', 'strength')
      .gt('weight', 0)
      .order('exercise_name', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    entries.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }

  const records = new Map();
  entries.forEach((entry) => {
    if (entry.weight_unit === 'bodyweight') return;

    const key = entry.exercise_name.trim().toLocaleLowerCase();
    const weightKg =
      Number(entry.weight) * (entry.weight_unit === 'lb' ? 0.45359237 : 1);
    const current = records.get(key);

    if (!current || weightKg > current.weightKg) {
      records.set(key, {
        exercise: entry.exercise_name,
        weightKg
      });
    }
  });

  return Array.from(records.values()).sort(
    (first, second) =>
      second.weightKg - first.weightKg ||
      first.exercise.localeCompare(second.exercise)
  );
}
