import type { EmailOtpType } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured } from '../../../lib/env';
import { createServerSupabaseClient } from '../../../lib/supabase/server';

function normalizeNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith('/')) {
    return '/operator';
  }

  return nextPath;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const nextPath = normalizeNextPath(searchParams.get('next'));

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL('/login?error=Supabase%20is%20not%20configured', request.url));
  }

  if (tokenHash && type) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, request.url));
    }
  }

  return NextResponse.redirect(
    new URL('/auth/error?message=Magic%20link%20confirmation%20failed', request.url)
  );
}
