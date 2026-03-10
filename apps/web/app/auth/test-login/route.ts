import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '../../../lib/supabase/server';
import { isSupabaseConfigured } from '../../../lib/env';

const testLoginSchema = z.object({
  role: z.enum(['operator', 'planner', 'driver']),
});

const demoAccounts = {
  driver: 'driver.demo@glowhaul.local',
  operator: 'operator.demo@glowhaul.local',
  planner: 'planner.demo@glowhaul.local',
} as const;

function isPlaywrightAuthRouteEnabled() {
  return process.env.PLAYWRIGHT_TEST === '1';
}

export async function POST(request: Request) {
  if (!isPlaywrightAuthRouteEnabled()) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase credentials are not configured.' }, { status: 503 });
  }

  const contentType = request.headers.get('content-type') ?? '';
  const rawRole =
    contentType.includes('application/json')
      ? ((await request.json()) as { role?: string }).role
      : (await request.formData()).get('role');

  const parsed = testLoginSchema.safeParse({ role: rawRole });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid demo role.' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: demoAccounts[parsed.data.role],
    password: 'demo-password',
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message ?? 'Demo sign-in failed.' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    role: parsed.data.role,
  });
}
