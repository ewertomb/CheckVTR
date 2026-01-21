
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://stskgrcbkzketgowsdwq.supabase.co';
const supabaseKey = 'sb_publishable_SxF3biOjd2vG752UfmMhrA_eUN_n4kZ';

export const supabase = createClient(supabaseUrl, supabaseKey);
