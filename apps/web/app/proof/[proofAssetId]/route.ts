import { NextRequest, NextResponse } from 'next/server';
import { recordIdSchema } from '@glowhaul/core';
import { requireAuthenticatedProfile } from '../../../lib/auth';
import { createAdminSupabaseClient } from '../../../lib/supabase/admin';

function notFoundResponse() {
  return new NextResponse('Not found', { status: 404 });
}

function serverErrorResponse(message = 'Unable to open proof asset.') {
  return new NextResponse(message, { status: 500 });
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ proofAssetId: string }> }
) {
  const { proofAssetId } = await context.params;

  if (!recordIdSchema.safeParse(proofAssetId).success) {
    return notFoundResponse();
  }

  const profile = await requireAuthenticatedProfile();
  const admin = createAdminSupabaseClient();

  if (!admin) {
    return new NextResponse('Supabase admin client is not configured.', { status: 503 });
  }

  const { data: asset, error: assetError } = await admin
    .from('proof_assets')
    .select('id, driver_id, run_id, storage_path')
    .eq('id', proofAssetId)
    .maybeSingle();

  if (assetError) {
    return serverErrorResponse();
  }

  if (!asset) {
    return notFoundResponse();
  }

  if (profile.role !== 'driver' && profile.role !== 'operator' && profile.role !== 'planner') {
    return notFoundResponse();
  }

  if (profile.role === 'driver') {
    if (asset.driver_id !== profile.id) {
      return notFoundResponse();
    }
  } else {
    const { data: run, error: runError } = await admin
      .from('runs')
      .select('id, booking_id')
      .eq('id', asset.run_id)
      .maybeSingle();

    if (runError) {
      return serverErrorResponse();
    }

    if (!run) {
      return notFoundResponse();
    }

    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .select('id, operator_organization_id, planner_organization_id')
      .eq('id', run.booking_id)
      .maybeSingle();

    if (bookingError) {
      return serverErrorResponse();
    }

    if (!booking) {
      return notFoundResponse();
    }

    if (profile.role === 'operator') {
      if (booking.operator_organization_id !== profile.organization_id) {
        return notFoundResponse();
      }
    } else if (profile.role === 'planner') {
      if (booking.planner_organization_id !== profile.organization_id) {
        return notFoundResponse();
      }
    }
  }

  const { data: signedUrl, error } = await admin.storage
    .from('proof-uploads')
    .createSignedUrl(asset.storage_path, 60);

  if (error || !signedUrl?.signedUrl) {
    return serverErrorResponse();
  }

  return NextResponse.redirect(signedUrl.signedUrl);
}
