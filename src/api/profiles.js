import { supabase } from '../lib/supabase';

export async function getMyProfile(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('user_id, display_name')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveMyProfile(userId, displayName) {
  const cleanName = displayName.trim();
  if (!cleanName || cleanName.length > 40) {
    throw new Error('Display name must be between 1 and 40 characters.');
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(
      { user_id: userId, display_name: cleanName },
      { onConflict: 'user_id' }
    )
    .select('user_id, display_name')
    .single();

  if (error) throw error;
  return data;
}
