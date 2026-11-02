import { supabase } from '../lib/supabase';

export async function getEntriesForDay(userId, dayId) {
  const { data, error } = await supabase
    .from('workout_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('day_id', dayId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getEntriesForDays(userId, dayIds) {
  if (!dayIds.length) return [];

  const { data, error } = await supabase
    .from('workout_entries')
    .select('*')
    .eq('user_id', userId)
    .in('day_id', dayIds);

  if (error) throw error;
  return data || [];
}

export async function getRecentEntries(userId, limit = 8) {
  const { data, error } = await supabase
    .from('workout_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getExerciseVolume(userId) {
  const { data, error } = await supabase
    .from('workout_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const map = new Map();

  (data || []).filter((entry) => entry.entry_type !== 'cardio').forEach((entry) => {
    const key = entry.exercise_name;
    const current = map.get(key) || {
      name: key,
      sets: 0,
      reps: 0,
      weight: 0
    };

    map.set(key, {
      name: key,
      sets: current.sets + Number(entry.sets || 0),
      reps: current.reps + Number(entry.reps || 0),
      weight: current.weight + Number(entry.weight || 0)
    });
  });

  return Array.from(map.values())
    .sort((a, b) => b.sets - a.sets)
    .slice(0, 8);
}

export async function saveWorkoutEntry(userId, payload) {
  const { id, ...rest } = payload;
  const entryType = rest.entry_type || 'strength';
  const distance = rest.distance_km == null ? null : Number(rest.distance_km);
  const speed = rest.speed_kmh == null ? null : Number(rest.speed_kmh);
  const setDetails = Array.isArray(rest.set_details)
    ? rest.set_details.map((set) => ({
        reps: Number(set.reps || 0),
        weight: Number(set.weight || 0)
      }))
    : [];

  if (entryType !== 'strength' && entryType !== 'cardio') {
    throw new Error('Entry type must be strength or cardio.');
  }
  if (
    entryType === 'cardio' &&
    (!Number.isFinite(distance) ||
      distance <= 0 ||
      !Number.isFinite(speed) ||
      speed <= 0)
  ) {
    throw new Error('Cardio entries require a positive distance and speed.');
  }
  if (
    entryType === 'strength' &&
    (setDetails.length === 0 ||
      setDetails.some(
        (set) =>
          !Number.isInteger(set.reps) ||
          set.reps < 0 ||
          !Number.isFinite(set.weight) ||
          set.weight < 0
      ))
  ) {
    throw new Error('Strength entries require at least one set with valid reps and weight.');
  }

  const insertPayload = {
    ...rest,
    set_details: entryType === 'strength' ? setDetails : [],
    entry_type: entryType,
    distance_km: entryType === 'cardio' ? distance : null,
    speed_kmh: entryType === 'cardio' ? speed : null,
    user_id: userId,
    exercise_name: rest.exercise_name || '',
    sets: entryType === 'strength' ? setDetails.length : 0,
    reps: setDetails[0]?.reps ?? 0,
    weight: setDetails.length
      ? Math.max(...setDetails.map((set) => set.weight))
      : Number(rest.weight || 0),
    notes: rest.notes || '',
    sort_order: rest.sort_order ?? 0,
    weight_unit: rest.weight_unit || 'kg'
  };

  const query = supabase.from('workout_entries');

  const { data, error } = id
    ? await query.update(insertPayload).eq('id', id).select().single()
    : await query.insert(insertPayload).select().single();

  if (error) throw error;
  return data;
}

export async function deleteWorkoutEntry(entryId) {
  const { error } = await supabase
    .from('workout_entries')
    .delete()
    .eq('id', entryId);

  if (error) throw error;
}
