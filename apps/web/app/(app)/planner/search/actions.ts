'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import type { Database } from '../../../../../../packages/supabase/types/database';
import { requireAuthenticatedProfile } from '../../../../lib/auth';
import { rethrowRedirectError } from '../../../../lib/redirect-errors';
import { createServerSupabaseClient } from '../../../../lib/supabase/server';

type OfferInsert = Database['public']['Tables']['offers']['Insert'];
type OfferRow = Database['public']['Tables']['offers']['Row'];
type SlotRow = Database['public']['Tables']['slots']['Row'];
const recordIdSchema = z.string().regex(/^[0-9a-fA-F-]{36}$/, 'Invalid id.');

const createOfferSchema = z.object({
  amountDollars: z.coerce.number().positive().max(50000),
  message: z.string().trim().max(280).optional(),
  returnTo: z.string().optional(),
  slotId: recordIdSchema,
});

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

function normalizeMessage(value?: string) {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeReturnPath(value?: string) {
  if (!value || !value.startsWith('/planner/search')) {
    return '/planner/search';
  }

  return value;
}

function appendMessage(path: string, key: 'error' | 'notice', message: string) {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}${key}=${encodeMessage(message)}`;
}

export async function submitPlannerOffer(formData: FormData) {
  const parsed = createOfferSchema.safeParse({
    amountDollars: formData.get('amountDollars'),
    message: formData.get('message'),
    returnTo: formData.get('returnTo'),
    slotId: formData.get('slotId'),
  });

  if (!parsed.success) {
    redirect('/planner/search?error=' + encodeMessage('Enter a valid amount before submitting your offer.'));
  }

  const returnPath = normalizeReturnPath(parsed.data.returnTo);

  try {
    const profile = await requireAuthenticatedProfile('planner');
    const supabase = await createServerSupabaseClient();

    if (!profile.organization_id) {
      redirect(appendMessage(returnPath, 'error', 'Your planner account is missing an organization.'));
    }

    const [{ data: slotResult }, { data: existingOfferResult }] = await Promise.all([
      supabase
        .from('slots')
        .select('id, status')
        .eq('id', parsed.data.slotId)
        .maybeSingle(),
      supabase
        .from('offers')
        .select('id, status')
        .eq('slot_id', parsed.data.slotId)
        .eq('planner_organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    const slot = slotResult as Pick<SlotRow, 'id' | 'status'> | null;
    const existingOffer = existingOfferResult as Pick<OfferRow, 'id' | 'status'> | null;

    if (!slot) {
      redirect(appendMessage(returnPath, 'error', 'That slot is no longer available in the marketplace.'));
    }

    if (slot.status === 'booked') {
      redirect(appendMessage(returnPath, 'error', 'That slot is already booked.'));
    }

    if (existingOffer && ['pending', 'accepted'].includes(existingOffer.status)) {
      redirect(appendMessage(returnPath, 'error', 'You already have an active offer on that slot.'));
    }

    const offerPayload: OfferInsert = {
      amount_cents: Math.round(parsed.data.amountDollars * 100),
      message: normalizeMessage(parsed.data.message),
      planner_organization_id: profile.organization_id,
      slot_id: parsed.data.slotId,
    };
    const { error } = await (supabase.from('offers') as any).insert(offerPayload);

    if (error) {
      redirect(appendMessage(returnPath, 'error', error.message));
    }
  } catch (error) {
    rethrowRedirectError(error);
    redirect(appendMessage(returnPath, 'error', error instanceof Error ? error.message : 'Unable to submit offer.'));
  }

  revalidatePath('/planner/search');
  revalidatePath('/operator');
  redirect(appendMessage(returnPath, 'notice', 'Offer submitted to the operator.'));
}
