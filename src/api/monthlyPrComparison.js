import { supabase } from '../lib/supabase';

export async function getMonthlyPrComparison(monthDate) {
  const monthKey = `${monthDate.getFullYear()}-${String(
    monthDate.getMonth() + 1
  ).padStart(2, '0')}-01`;
  const { data, error } = await supabase.rpc('get_monthly_pr_comparison', {
    p_month: monthKey
  });

  if (error) throw error;
  return data || [];
}
