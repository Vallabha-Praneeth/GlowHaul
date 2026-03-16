import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '../../../lib/auth';
import { createServerSupabaseClient } from '../../../lib/supabase/server';
import type { Database } from '../../../../../packages/supabase/types/database';

function getSafeTargetHref(href: string | null | undefined) {
  if (!href || !href.startsWith('/')) {
    return '/operator';
  }

  return href;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ notificationId: string }> }
) {
  const { profile } = await getCurrentAuth();

  if (!profile) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { notificationId } = await context.params;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('href')
    .eq('id', notificationId)
    .eq('recipient_profile_id', profile.id)
    .maybeSingle();
  const notification = data as Pick<
    Database['public']['Tables']['notifications']['Row'],
    'href'
  > | null;

  if (error || !notification) {
    return NextResponse.redirect(new URL('/auth/error?message=Notification%20not%20found', request.url));
  }

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() } as never)
    .eq('id', notificationId)
    .eq('recipient_profile_id', profile.id)
    .is('read_at', null);

  return NextResponse.redirect(new URL(getSafeTargetHref(notification.href), request.url));
}
