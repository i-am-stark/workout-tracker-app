import { supabase } from '../lib/supabase';

export async function getExercises(userId) {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function searchExercises(userId, query) {
  const value = query.trim();
  if (!value) return [];

  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', userId)
    .ilike('name', `%${value}%`)
    .order('name', { ascending: true })
    .limit(8);

  if (error) throw error;
  return data || [];
}

export async function upsertExercise(userId, exerciseName) {
  const name = exerciseName.trim();
  if (!name) return null;

  const { data, error } = await supabase
    .from('exercises')
    .upsert({ user_id: userId, name }, { onConflict: 'user_id,name' })
    .select()
    .single();

  if (error) throw error;
  return data;
}
