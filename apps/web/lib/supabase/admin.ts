import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../packages/supabase/types/database';
import { env, isSupabaseConfigured } from '../env';

export function createAdminSupabaseClient() {
  if (!isSupabaseConfigured() || !env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY === 'replace_me') {
    return null;
  }

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
