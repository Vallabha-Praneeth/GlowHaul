import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '../../../../packages/supabase/types/database';
import { env, isSupabaseConfigured } from '../env';

type SupabaseCookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export async function createServerSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase credentials are not configured.');
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: SupabaseCookie[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Ignore write attempts when running in a render-only context.
        }
      },
    },
  });
}

export async function getAuthenticatedUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
