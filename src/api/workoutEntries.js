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

  (data || []).forEach((entry) => {
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

  const insertPayload = {
    ...rest,
    user_id: userId,
    exercise_name: rest.exercise_name || '',
    sets: Number(rest.sets || 0),
    reps: Number(rest.reps || 0),
    weight: Number(rest.weight || 0),
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
