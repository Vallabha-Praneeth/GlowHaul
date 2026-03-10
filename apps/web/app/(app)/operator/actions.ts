'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { Constants, type Database } from '../../../../../packages/supabase/types/database';
import { requireAuthenticatedProfile } from '../../../lib/auth';
import { rethrowRedirectError } from '../../../lib/redirect-errors';
import { createServerSupabaseClient } from '../../../lib/supabase/server';

type RegionCode = Database['public']['Enums']['region_code'];
type SlotStatus = Database['public']['Enums']['slot_status'];
type BookingStatus = Database['public']['Enums']['booking_status'];
type ProofAssetStatus = Database['public']['Enums']['proof_asset_status'];
type RunStatus = Database['public']['Enums']['run_status'];
type RunInsert = Database['public']['Tables']['runs']['Insert'];
type SlotInsert = Database['public']['Tables']['slots']['Insert'];

const regionSchema = z.enum(Constants.public.Enums.region_code);
const slotStatusSchema = z.enum(Constants.public.Enums.slot_status);
const recordIdSchema = z.string().regex(/^[0-9a-fA-F-]{36}$/, 'Invalid id.');

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

const bookingStatusSchema = z.enum(Constants.public.Enums.booking_status);
const runStatusSchema = z.enum(Constants.public.Enums.run_status);
const proofStatusSchema = z.enum(Constants.public.Enums.proof_asset_status);

const campaignExecutionSchema = z.object({
  bookingId: recordIdSchema,
  bookingStatus: bookingStatusSchema,
  driverId: recordIdSchema,
  endAt: z.string().min(16),
  internalNote: z.string().trim().max(280).optional(),
  proofRequired: z.union([z.literal('on'), z.literal('true'), z.literal('false')]).optional(),
  runStatus: runStatusSchema.optional(),
  startAt: z.string().min(16),
});

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
    await requireAuthenticatedProfile('operator');
    const supabase = await createServerSupabaseClient();
    const { error } = await (supabase as any).rpc('accept_offer', {
      target_campaign_name: parsed.data.campaignName,
      target_offer_id: parsed.data.offerId,
      target_operator_note: normalizeNotes(parsed.data.operatorNote),
    });

    if (error) {
      redirect('/operator?error=' + encodeMessage(error.message));
    }
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
    driverId: formData.get('driverId'),
    endAt: formData.get('endAt'),
    internalNote: formData.get('internalNote'),
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

    const startAt = normalizeDateTimeInput(parsed.data.startAt);
    const endAt = normalizeDateTimeInput(parsed.data.endAt);

    if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
      throw new Error('The run end time must be after the start time.');
    }

    const { data: driver } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', parsed.data.driverId)
      .eq('organization_id', profile.organization_id)
      .eq('role', 'driver')
      .maybeSingle();

    if (!driver) {
      throw new Error('Choose a valid driver before saving dispatch changes.');
    }

    const bookingResult = await supabase
      .from('bookings')
      .select('id, slot_id')
      .eq('id', parsed.data.bookingId)
      .eq('operator_organization_id', profile.organization_id)
      .maybeSingle();
    const booking = bookingResult.data as Pick<Database['public']['Tables']['bookings']['Row'], 'id' | 'slot_id'> | null;

    if (!booking) {
      throw new Error('That campaign is no longer available to update.');
    }

    const runResult = await supabase
      .from('runs')
      .select('id, status')
      .eq('booking_id', booking.id)
      .order('scheduled_start_at')
      .limit(1)
      .maybeSingle();
    const run = runResult.data as Pick<Database['public']['Tables']['runs']['Row'], 'id' | 'status'> | null;

    const bookingStatus = parsed.data.bookingStatus as BookingStatus;
    const runStatus = (parsed.data.runStatus as RunStatus | undefined) ?? (run ? run.status : 'assigned');
    const proofRequired = parsed.data.proofRequired === 'on' || parsed.data.proofRequired === 'true';
    const nextSlotStatus: SlotStatus =
      bookingStatus === 'cancelled'
        ? 'cancelled'
        : bookingStatus === 'completed' || runStatus === 'completed'
          ? 'completed'
          : bookingStatus === 'in_progress' || runStatus === 'en_route' || runStatus === 'live'
            ? 'running'
            : 'booked';

    const bookingUpdate = await (supabase.from('bookings') as any)
      .update({
        internal_note: normalizeNotes(parsed.data.internalNote),
        status: bookingStatus,
      })
      .eq('id', booking.id)
      .eq('operator_organization_id', profile.organization_id);

    if (bookingUpdate.error) {
      throw new Error(bookingUpdate.error.message);
    }

    const slotUpdate = await (supabase.from('slots') as any)
      .update({ status: nextSlotStatus })
      .eq('id', booking.slot_id)
      .eq('operator_organization_id', profile.organization_id);

    if (slotUpdate.error) {
      throw new Error(slotUpdate.error.message);
    }

    if (run) {
      const runUpdate = await (supabase.from('runs') as any)
        .update({
          driver_id: parsed.data.driverId,
          proof_required: proofRequired,
          scheduled_end_at: endAt,
          scheduled_start_at: startAt,
          status: runStatus,
        })
        .eq('id', run.id);

      if (runUpdate.error) {
        throw new Error(runUpdate.error.message);
      }
    } else {
      const runPayload: RunInsert = {
        booking_id: booking.id,
        driver_id: parsed.data.driverId,
        proof_required: proofRequired,
        scheduled_end_at: endAt,
        scheduled_start_at: startAt,
        status: runStatus,
      };
      const runInsert = await (supabase.from('runs') as any).insert(runPayload);

      if (runInsert.error) {
        throw new Error(runInsert.error.message);
      }
    }
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
    await requireAuthenticatedProfile('operator');
    const supabase = await createServerSupabaseClient();
    const { error } = await (supabase as any).rpc('review_proof_asset', {
      target_proof_asset_id: parsed.data.proofAssetId,
      target_review_notes: normalizeNotes(parsed.data.reviewNotes),
      target_status: parsed.data.status as ProofAssetStatus,
    });

    if (error) {
      redirect('/operator?error=' + encodeMessage(error.message));
    }
  } catch (error) {
    rethrowRedirectError(error);
    redirect('/operator?error=' + encodeMessage(error instanceof Error ? error.message : 'Unable to review proof.'));
  }

  revalidatePath('/operator');
  revalidatePath('/driver');
  redirect('/operator?notice=' + encodeMessage('Proof review saved.'));
}
