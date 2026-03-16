'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { campaignCloseoutSchema, campaignPublicShareSchema, recordIdSchema } from '@glowhaul/core';
import type { Database } from '../../../../../../packages/supabase/types/database';
import { requireAuthenticatedProfile } from '../../../../lib/auth';
import { notifyPlannerCampaignCloseout } from '../../../../lib/notifications';
import { rethrowRedirectError } from '../../../../lib/redirect-errors';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

function getRecapPath(bookingId: string, key?: 'error' | 'notice', message?: string) {
  const path = `/campaigns/${bookingId}`;

  if (!key || !message) {
    return path;
  }

  return `${path}?${key}=${encodeMessage(message)}`;
}

async function requireRecapManager() {
  const profile = await requireAuthenticatedProfile();

  if (profile.role !== 'operator' && profile.role !== 'planner') {
    throw new Error('Only operators or planners can manage campaign closeout.');
  }

  return createServerSupabaseClient();
}

function getFallbackRecapPath(formData: FormData) {
  const bookingId = formData.get('bookingId');

  if (typeof bookingId === 'string' && recordIdSchema.safeParse(bookingId).success) {
    return getRecapPath(bookingId);
  }

  return '/planner/search';
}

export async function updateCampaignCloseoutAction(formData: FormData) {
  const fallbackPath = getFallbackRecapPath(formData);
  const parsed = campaignCloseoutSchema.safeParse({
    bookingId: formData.get('bookingId'),
    intent: formData.get('intent'),
    note: formData.get('note'),
  });

  if (!parsed.success) {
    redirect(`${fallbackPath}?error=${encodeMessage('Enter a valid closeout update before saving.')}`);
  }

  try {
    const supabase = await requireRecapManager();
    const profile = await requireAuthenticatedProfile();
    const rpcArgs: Database['public']['Functions']['update_campaign_closeout']['Args'] = {
      target_booking_id: parsed.data.bookingId,
      target_intent: parsed.data.intent,
      target_note: parsed.data.note === undefined ? undefined : parsed.data.note.trim(),
    };
    const { error } = await supabase.rpc('update_campaign_closeout', rpcArgs as never);

    if (error) {
      throw new Error(error.message);
    }

    await notifyPlannerCampaignCloseout({
      actorProfileId: profile.id,
      bookingId: parsed.data.bookingId,
      kind: parsed.data.intent === 'mark_client_ready' ? 'campaign_client_ready' : 'campaign_closed',
    });
  } catch (error) {
    rethrowRedirectError(error);
    redirect(
      getRecapPath(
        parsed.data.bookingId,
        'error',
        error instanceof Error ? error.message : 'Unable to update campaign closeout.',
      ),
    );
  }

  revalidatePath(getRecapPath(parsed.data.bookingId));
  revalidatePath('/operator');
  revalidatePath('/planner/search');
  revalidatePath('/driver');
  redirect(
    getRecapPath(
      parsed.data.bookingId,
      'notice',
      parsed.data.intent === 'mark_client_ready' ? 'Campaign marked client-ready.' : 'Campaign closeout completed.',
    ),
  );
}

export async function manageCampaignPublicShareAction(formData: FormData) {
  const fallbackPath = getFallbackRecapPath(formData);
  const parsed = campaignPublicShareSchema.safeParse({
    bookingId: formData.get('bookingId'),
    intent: formData.get('intent'),
  });

  if (!parsed.success) {
    redirect(`${fallbackPath}?error=${encodeMessage('Choose a valid recap share action before saving.')}`);
  }

  try {
    const supabase = await requireRecapManager();

    if (parsed.data.intent === 'create') {
      const rpcArgs: Database['public']['Functions']['create_or_refresh_campaign_recap_share']['Args'] = {
        target_booking_id: parsed.data.bookingId,
        target_expiry_hours: 24 * 7,
      };
      const { error } = await supabase.rpc('create_or_refresh_campaign_recap_share', rpcArgs as never);

      if (error) {
        throw new Error(error.message);
      }
    } else {
      const rpcArgs: Database['public']['Functions']['revoke_campaign_recap_share']['Args'] = {
        target_booking_id: parsed.data.bookingId,
      };
      const { error } = await supabase.rpc('revoke_campaign_recap_share', rpcArgs as never);

      if (error) {
        throw new Error(error.message);
      }
    }
  } catch (error) {
    rethrowRedirectError(error);
    redirect(
      getRecapPath(
        parsed.data.bookingId,
        'error',
        error instanceof Error ? error.message : 'Unable to update the public recap link.',
      ),
    );
  }

  revalidatePath(getRecapPath(parsed.data.bookingId));
  redirect(
    getRecapPath(
      parsed.data.bookingId,
      'notice',
      parsed.data.intent === 'create'
        ? 'Public recap link is ready to share.'
        : 'Public recap link revoked.',
    ),
  );
}
