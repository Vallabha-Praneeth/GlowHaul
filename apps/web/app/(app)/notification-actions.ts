'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentAuth, getDefaultHomePath } from '../../lib/auth';
import { markAllNotificationsRead } from '../../lib/notifications';

function getRedirectTarget(referer: string | null, fallbackPath: string) {
  if (!referer) {
    return { redirectTarget: fallbackPath, revalidateTarget: fallbackPath };
  }

  try {
    const url = new URL(referer);
    const pathWithSearch = `${url.pathname}${url.search}`;

    if (!url.pathname.startsWith('/')) {
      return { redirectTarget: fallbackPath, revalidateTarget: fallbackPath };
    }

    return {
      redirectTarget: pathWithSearch,
      revalidateTarget: url.pathname,
    };
  } catch {
    return { redirectTarget: fallbackPath, revalidateTarget: fallbackPath };
  }
}

export async function markNotificationsReadAction() {
  const { profile } = await getCurrentAuth();

  if (!profile) {
    redirect('/login');
  }

  const fallbackPath = getDefaultHomePath(profile.role);
  const headerStore = await headers();
  const referer = headerStore.get('referer');
  const { redirectTarget, revalidateTarget } = getRedirectTarget(referer, fallbackPath);

  await markAllNotificationsRead(profile.id);

  revalidatePath(fallbackPath);
  if (revalidateTarget !== fallbackPath) {
    revalidatePath(revalidateTarget);
  }

  redirect(redirectTarget);
}
