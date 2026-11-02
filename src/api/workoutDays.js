import { supabase } from '../lib/supabase';

export async function getWorkoutDaysForMonth(userId, startDate, endDate) {
  const { data, error } = await supabase
    .from('workout_days')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getRecentWorkoutDays(userId, limit = 8) {
  const { data, error } = await supabase
    .from('workout_days')
    .select('id, date, workout_type')
    .eq('user_id', userId)
    .eq('status', 'workout')
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function saveWorkoutDay(userId, payload) {
  const includesWorkoutType = Object.prototype.hasOwnProperty.call(payload, 'workout_type');
  const existingDay = includesWorkoutType
    ? null
    : await getWorkoutDay(userId, payload.date);

  const { data, error } = await supabase
    .from('workout_days')
    .upsert(
      {
        user_id: userId,
        date: payload.date,
        status: payload.status || 'empty',
        notes: payload.notes || '',
        workout_type: includesWorkoutType
          ? payload.workout_type
          : existingDay?.workout_type ?? null
      },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getWorkoutDay(userId, date) {
  const { data, error } = await supabase
    .from('workout_days')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  if (error) throw error;
  return data;
}
