'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { env, isSupabaseConfigured } from '../../../lib/env';
import { createServerSupabaseClient } from '../../../lib/supabase/server';

const magicLinkSchema = z.object({
  email: z.string().trim().email(),
  next: z.string().optional(),
});

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

function normalizeNextPath(nextPath?: string) {
  if (!nextPath || !nextPath.startsWith('/')) {
    return '/operator';
  }

  return nextPath;
}

export async function requestMagicLink(formData: FormData) {
  const parsed = magicLinkSchema.safeParse({
    email: formData.get('email'),
    next: formData.get('next'),
  });

  if (!parsed.success) {
    redirect('/login?error=' + encodeMessage('Enter a valid work email.'));
  }

  if (!isSupabaseConfigured()) {
    redirect('/login?error=' + encodeMessage('Supabase credentials are not configured yet.'));
  }

  const nextPath = normalizeNextPath(parsed.data.next);
  const headerStore = await headers();
  const origin = headerStore.get('origin') ?? env.NEXT_PUBLIC_APP_URL;
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(nextPath)}`,
    },
  });

  if (error) {
    redirect('/login?error=' + encodeMessage(error.message));
  }

  redirect('/login?sent=1');
}

const demoLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  next: z.string().optional(),
});

export async function requestDemoSession(formData: FormData) {
  const parsed = demoLoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next'),
  });

  if (!parsed.success) {
    redirect('/login?error=' + encodeMessage('Enter valid demo credentials.'));
  }

  if (!isSupabaseConfigured()) {
    redirect('/login?error=' + encodeMessage('Supabase credentials are not configured yet.'));
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    redirect('/login?error=' + encodeMessage(error?.message ?? 'Sign-in failed.'));
  }

  const nextPath = parsed.data.next && parsed.data.next.startsWith('/') ? parsed.data.next : undefined;

  redirect(nextPath ?? '/');
}

export async function signOutUser() {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }

  redirect('/login');
}
