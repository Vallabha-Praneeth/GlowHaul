'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { campaignExecutionSchema, recordIdSchema, type CampaignExecutionInput } from '@glowhaul/core';
import { Constants, type Database } from '../../../../../packages/supabase/types/database';
import { requireAuthenticatedProfile } from '../../../lib/auth';
import {
  notifyDriverProofReviewed,
  notifyDriversDispatchUpdated,
  notifyPlannerOfferAccepted,
} from '../../../lib/notifications';
import { rethrowRedirectError } from '../../../lib/redirect-errors';
import { createServerSupabaseClient } from '../../../lib/supabase/server';

type RegionCode = Database['public']['Enums']['region_code'];
type SlotStatus = Database['public']['Enums']['slot_status'];
type BookingStatus = Database['public']['Enums']['booking_status'];
type ProofAssetStatus = Database['public']['Enums']['proof_asset_status'];
type RunStatus = Database['public']['Enums']['run_status'];
type SlotInsert = Database['public']['Tables']['slots']['Insert'];

const regionSchema = z.enum(Constants.public.Enums.region_code);
const slotStatusSchema = z.enum(Constants.public.Enums.slot_status);

const slotMutationSchema = z.object({
  campaignNotes: z.string().trim().max(280).optional(),
  endAt: z.string().min(16),
  rateDollars: z.coerce.number().positive().max(50000),
  region: regionSchema,
  startAt: z.string().min(16),
  status: slotStatusSchema,
  truckId: recordIdSchema,
});

const slotUpdateSchema = slotMutationSchema.extend({
  slotId: recordIdSchema,
});

const acceptOfferSchema = z.object({
  campaignName: z.string().trim().min(3).max(120),
  offerId: recordIdSchema,
  operatorNote: z.string().trim().max(280).optional(),
});

const rejectOfferSchema = z.object({
  offerId: recordIdSchema,
  operatorNote: z.string().trim().max(280).optional(),
});

const proofStatusSchema = z.enum(Constants.public.Enums.proof_asset_status);

const proofReviewSchema = z.object({
  proofAssetId: recordIdSchema,
  reviewNotes: z.string().trim().max(280).optional(),
  status: proofStatusSchema.refine((value) => value === 'approved' || value === 'rejected', {
    message: 'Status must be approved or rejected.',
  }),
});

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

function normalizeDateTimeInput(value: string) {
  const normalized = new Date(`${value}:00Z`);

  if (Number.isNaN(normalized.getTime())) {
    throw new Error('Enter a valid UTC start and end time.');
  }

  return normalized.toISOString();
}

function normalizeNotes(value?: string) {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeCampaignExecutionState(
  input: CampaignExecutionInput
): { bookingStatus: BookingStatus; driverId: string | null; runStatus: RunStatus } {
  const intent = input.intent ?? 'save';
  let bookingStatus = input.bookingStatus as BookingStatus;
  let runStatus = (input.runStatus as RunStatus | undefined) ?? 'assigned';
  let driverId = input.driverId ?? null;

  if (intent === 'cancel') {
    return {
      bookingStatus: 'cancelled',
      driverId: null,
      runStatus: 'assigned',
    };
  }

  if (intent === 'pause') {
    return {
      bookingStatus: 'in_progress',
      driverId,
      runStatus: 'issue',
    };
  }

  if (intent === 'resolve') {
    return {
      bookingStatus: 'in_progress',
      driverId,
      runStatus: input.runStatus === 'live' ? 'live' : 'en_route',
    };
  }

  if (bookingStatus === 'cancelled') {
    throw new Error('Use the cancel campaign action instead of saving a cancelled state.');
  }

  if (runStatus === 'completed') {
    bookingStatus = 'completed';
  } else if (runStatus === 'en_route' || runStatus === 'live' || runStatus === 'issue') {
    bookingStatus = 'in_progress';
  } else if (bookingStatus === 'in_progress') {
    runStatus = 'en_route';
  } else if (bookingStatus === 'completed') {
    runStatus = 'completed';
  } else {
    bookingStatus = 'confirmed';
    runStatus = 'assigned';
  }

  if (bookingStatus === 'completed' && runStatus !== 'completed') {
    throw new Error('Completed campaigns must keep the run in completed state.');
  }

  if (bookingStatus === 'in_progress' && !['en_route', 'live', 'issue'].includes(runStatus)) {
    throw new Error('In-progress campaigns must use en route, live, or issue run states.');
  }

  if (bookingStatus === 'confirmed' && runStatus !== 'assigned') {
    throw new Error('Confirmed campaigns must keep the run in assigned state until dispatch begins.');
  }

  return {
    bookingStatus,
    driverId,
    runStatus,
  };
}

async function requireOperatorContext() {
  const profile = await requireAuthenticatedProfile('operator');
  const supabase = await createServerSupabaseClient();

  if (!profile.organization_id) {
    throw new Error('Your operator account is missing an organization.');
  }

  return {
    organizationId: profile.organization_id,
    supabase,
  };
}

export async function createSlotInventory(formData: FormData) {
  const parsed = slotMutationSchema.safeParse({
    campaignNotes: formData.get('campaignNotes'),
    endAt: formData.get('endAt'),
    rateDollars: formData.get('rateDollars'),
    region: formData.get('region'),
    startAt: formData.get('startAt'),
    status: formData.get('status'),
    truckId: formData.get('truckId'),
  });

  if (!parsed.success) {
    redirect('/operator?error=' + encodeMessage('Enter a valid truck, region, time window, and rate.'));
  }

  try {
    const { organizationId, supabase } = await requireOperatorContext();
    const { data: truck } = await supabase
      .from('trucks')
      .select('id')
      .eq('id', parsed.data.truckId)
      .eq('operator_organization_id', organizationId)
      .maybeSingle();

    if (!truck) {
      redirect('/operator?error=' + encodeMessage('Choose a valid operator truck before creating a slot.'));
    }

    const startAt = normalizeDateTimeInput(parsed.data.startAt);
    const endAt = normalizeDateTimeInput(parsed.data.endAt);

    if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
      redirect('/operator?error=' + encodeMessage('The slot end time must be after the start time.'));
    }

    const slotPayload: SlotInsert = {
      campaign_notes: normalizeNotes(parsed.data.campaignNotes),
      end_at: endAt,
      operator_organization_id: organizationId,
      rate_cents: Math.round(parsed.data.rateDollars * 100),
      region: parsed.data.region,
      start_at: startAt,
      status: parsed.data.status,
      truck_id: parsed.data.truckId,
    };
    const { error } = await (supabase.from('slots') as any).insert(slotPayload);

    if (error) {
      redirect('/operator?error=' + encodeMessage(error.message));
    }
  } catch (error) {
    rethrowRedirectError(error);
    redirect('/operator?error=' + encodeMessage(error instanceof Error ? error.message : 'Unable to create slot.'));
  }

  revalidatePath('/operator');
  redirect('/operator?notice=' + encodeMessage('Slot inventory created.'));
}

export async function updateSlotInventory(formData: FormData) {
  const parsed = slotUpdateSchema.safeParse({
    campaignNotes: formData.get('campaignNotes'),
    endAt: formData.get('endAt'),
    rateDollars: formData.get('rateDollars'),
    region: formData.get('region'),
    slotId: formData.get('slotId'),
    startAt: formData.get('startAt'),
    status: formData.get('status'),
    truckId: formData.get('truckId'),
  });

  if (!parsed.success) {
    redirect('/operator?error=' + encodeMessage('Enter valid values before saving slot changes.'));
  }

  try {
    const { organizationId, supabase } = await requireOperatorContext();
    const [slotResult, truckResult] = await Promise.all([
      supabase
        .from('slots')
        .select('id')
        .eq('id', parsed.data.slotId)
        .eq('operator_organization_id', organizationId)
        .maybeSingle(),
      supabase
        .from('trucks')
        .select('id')
        .eq('id', parsed.data.truckId)
        .eq('operator_organization_id', organizationId)
        .maybeSingle(),
    ]);

    if (!slotResult.data) {
      redirect('/operator?error=' + encodeMessage('That slot is no longer available to edit.'));
    }

    if (!truckResult.data) {
      redirect('/operator?error=' + encodeMessage('Choose a valid operator truck before saving.'));
    }

    const startAt = normalizeDateTimeInput(parsed.data.startAt);
    const endAt = normalizeDateTimeInput(parsed.data.endAt);

    if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
      redirect('/operator?error=' + encodeMessage('The slot end time must be after the start time.'));
    }

    const slotPayload: Partial<SlotInsert> = {
        campaign_notes: normalizeNotes(parsed.data.campaignNotes),
        end_at: endAt,
        rate_cents: Math.round(parsed.data.rateDollars * 100),
        region: parsed.data.region,
        start_at: startAt,
        status: parsed.data.status,
        truck_id: parsed.data.truckId,
      };
    const { error } = await (supabase
      .from('slots') as any)
      .update(slotPayload)
      .eq('id', parsed.data.slotId)
      .eq('operator_organization_id', organizationId);

    if (error) {
      redirect('/operator?error=' + encodeMessage(error.message));
    }
  } catch (error) {
    rethrowRedirectError(error);
    redirect('/operator?error=' + encodeMessage(error instanceof Error ? error.message : 'Unable to save slot changes.'));
  }

  revalidatePath('/operator');
  redirect('/operator?notice=' + encodeMessage('Slot inventory updated.'));
}

export async function acceptPlannerOffer(formData: FormData) {
  const parsed = acceptOfferSchema.safeParse({
    campaignName: formData.get('campaignName'),
    offerId: formData.get('offerId'),
    operatorNote: formData.get('operatorNote'),
  });

  if (!parsed.success) {
    redirect('/operator?error=' + encodeMessage('Provide a campaign name before accepting an offer.'));
  }

  try {
    const profile = await requireAuthenticatedProfile('operator');
    const supabase = await createServerSupabaseClient();
    const { error } = await (supabase as any).rpc('accept_offer', {
      target_campaign_name: parsed.data.campaignName,
      target_offer_id: parsed.data.offerId,
      target_operator_note: normalizeNotes(parsed.data.operatorNote),
    });

    if (error) {
      redirect('/operator?error=' + encodeMessage(error.message));
    }

    await notifyPlannerOfferAccepted({
      actorProfileId: profile.id,
      campaignName: parsed.data.campaignName,
      offerId: parsed.data.offerId,
    });
  } catch (error) {
    rethrowRedirectError(error);
    redirect('/operator?error=' + encodeMessage(error instanceof Error ? error.message : 'Unable to accept offer.'));
  }

  revalidatePath('/operator');
  revalidatePath('/planner/search');
  redirect('/operator?notice=' + encodeMessage('Offer accepted and slot booked.'));
}

export async function rejectPlannerOffer(formData: FormData) {
  const parsed = rejectOfferSchema.safeParse({
    offerId: formData.get('offerId'),
    operatorNote: formData.get('operatorNote'),
  });

  if (!parsed.success) {
    redirect('/operator?error=' + encodeMessage('Add a short note before rejecting an offer.'));
  }

  try {
    await requireAuthenticatedProfile('operator');
    const supabase = await createServerSupabaseClient();
    const { error } = await (supabase as any).rpc('reject_offer', {
      target_offer_id: parsed.data.offerId,
      target_operator_note: normalizeNotes(parsed.data.operatorNote),
    });

    if (error) {
      redirect('/operator?error=' + encodeMessage(error.message));
    }
  } catch (error) {
    rethrowRedirectError(error);
    redirect('/operator?error=' + encodeMessage(error instanceof Error ? error.message : 'Unable to reject offer.'));
  }

  revalidatePath('/operator');
  revalidatePath('/planner/search');
  redirect('/operator?notice=' + encodeMessage('Offer rejected.'));
}

export async function updateCampaignExecution(formData: FormData) {
  const parsed = campaignExecutionSchema.safeParse({
    bookingId: formData.get('bookingId'),
    bookingStatus: formData.get('bookingStatus'),
    driverId:
      typeof formData.get('driverId') === 'string' && formData.get('driverId') !== ''
        ? (formData.get('driverId') as string)
        : undefined,
    endAt: formData.get('endAt'),
    internalNote: typeof formData.get('internalNote') === 'string' ? (formData.get('internalNote') as string) : undefined,
    intent: formData.get('intent') || undefined,
    issueNote: typeof formData.get('issueNote') === 'string' ? (formData.get('issueNote') as string) : undefined,
    proofRequired: formData.get('proofRequired') ?? 'false',
    runStatus: formData.get('runStatus') || undefined,
    startAt: formData.get('startAt'),
  });

  if (!parsed.success) {
    redirect('/operator?error=' + encodeMessage('Enter valid booking and run updates before saving.'));
  }

  try {
    const profile = await requireAuthenticatedProfile('operator');
    const supabase = await createServerSupabaseClient();
    if (!profile.organization_id) {
      throw new Error('Your operator account is missing an organization.');
    }

    const { data: currentRunData, error: currentRunError } = await supabase
      .from('runs')
      .select('driver_id')
      .eq('booking_id', parsed.data.bookingId)
      .order('scheduled_start_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (currentRunError) {
      throw new Error(currentRunError.message);
    }

    const currentRunResult = currentRunData as Pick<Database['public']['Tables']['runs']['Row'], 'driver_id'> | null;
    const currentDriverId = currentRunResult?.driver_id ?? null;
    const startAt = normalizeDateTimeInput(parsed.data.startAt);
    const endAt = normalizeDateTimeInput(parsed.data.endAt);

    if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
      throw new Error('The run end time must be after the start time.');
    }
    const normalized = normalizeCampaignExecutionState(parsed.data);
    const proofRequired = parsed.data.proofRequired === 'on' || parsed.data.proofRequired === 'true';
    const issueNote = normalizeNotes(parsed.data.issueNote);
    const nextSlotStatus: SlotStatus =
      normalized.bookingStatus === 'cancelled'
        ? 'cancelled'
        : normalized.bookingStatus === 'completed' || normalized.runStatus === 'completed'
          ? 'completed'
          : normalized.bookingStatus === 'in_progress' || normalized.runStatus === 'en_route' || normalized.runStatus === 'live'
            ? 'running'
            : 'booked';

    if ((parsed.data.intent === 'pause' || normalized.runStatus === 'issue') && !issueNote) {
      throw new Error('Add an issue note before parking a run in issue state.');
    }

    if (normalized.bookingStatus !== 'cancelled' && !normalized.driverId) {
      throw new Error('Choose a valid driver before saving dispatch changes.');
    }

    const rpcArgs: Database['public']['Functions']['mutate_booking_slot_run_transaction']['Args'] = {
      target_booking_id: parsed.data.bookingId,
      target_booking_status: normalized.bookingStatus,
      target_driver_id: normalized.driverId ?? undefined,
      target_end_at: endAt,
      target_internal_note: normalizeNotes(parsed.data.internalNote) ?? undefined,
      target_issue_note: issueNote ?? undefined,
      target_operator_organization_id: profile.organization_id,
      target_proof_required: proofRequired,
      target_run_status: normalized.runStatus,
      target_slot_status: nextSlotStatus,
      target_start_at: startAt,
    };
    const { error } = await supabase.rpc('mutate_booking_slot_run_transaction', rpcArgs as never);

    if (error) {
      throw new Error(error.message);
    }

    await notifyDriversDispatchUpdated({
      actorProfileId: profile.id,
      bookingId: parsed.data.bookingId,
      intent: typeof parsed.data.intent === 'string' ? parsed.data.intent : null,
      previousDriverId: currentDriverId,
      targetDriverId: normalized.bookingStatus === 'cancelled' ? null : normalized.driverId,
    });
  } catch (error) {
    rethrowRedirectError(error);
    redirect('/operator?error=' + encodeMessage(error instanceof Error ? error.message : 'Unable to update campaign execution.'));
  }

  revalidatePath('/operator');
  revalidatePath('/planner/search');
  revalidatePath('/driver');
  redirect('/operator?notice=' + encodeMessage('Campaign execution updated.'));
}

export async function reviewDriverProof(formData: FormData) {
  const parsed = proofReviewSchema.safeParse({
    proofAssetId: formData.get('proofAssetId'),
    reviewNotes: formData.get('reviewNotes'),
    status: formData.get('status'),
  });

  if (!parsed.success) {
    redirect('/operator?error=' + encodeMessage('Choose approve or reject before reviewing proof.'));
  }

  try {
    const profile = await requireAuthenticatedProfile('operator');
    const supabase = await createServerSupabaseClient();
    const { error } = await (supabase as any).rpc('review_proof_asset', {
      target_proof_asset_id: parsed.data.proofAssetId,
      target_review_notes: normalizeNotes(parsed.data.reviewNotes),
      target_status: parsed.data.status as ProofAssetStatus,
    });

    if (error) {
      redirect('/operator?error=' + encodeMessage(error.message));
    }

    await notifyDriverProofReviewed({
      actorProfileId: profile.id,
      proofAssetId: parsed.data.proofAssetId,
    });
  } catch (error) {
    rethrowRedirectError(error);
    redirect('/operator?error=' + encodeMessage(error instanceof Error ? error.message : 'Unable to review proof.'));
  }

  revalidatePath('/operator');
  revalidatePath('/driver');
  redirect('/operator?notice=' + encodeMessage('Proof review saved.'));
}
