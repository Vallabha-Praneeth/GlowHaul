import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedProfile } from '../../../lib/auth';
import { createAdminSupabaseClient } from '../../../lib/supabase/admin';

const recordIdPattern = /^[0-9a-fA-F-]{36}$/;

function notFoundResponse() {
  return new NextResponse('Not found', { status: 404 });
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ proofAssetId: string }> }
) {
  const { proofAssetId } = await context.params;

  if (!recordIdPattern.test(proofAssetId)) {
    return notFoundResponse();
  }

  const profile = await requireAuthenticatedProfile();
  const admin = createAdminSupabaseClient();

  if (!admin) {
    return new NextResponse('Supabase admin client is not configured.', { status: 503 });
  }

  const { data: asset } = await admin
    .from('proof_assets')
    .select('id, driver_id, run_id, storage_path')
    .eq('id', proofAssetId)
    .maybeSingle();

  if (!asset) {
    return notFoundResponse();
  }

  if (profile.role === 'driver') {
    if (asset.driver_id !== profile.id) {
      return notFoundResponse();
    }
  } else {
    const { data: run } = await admin
      .from('runs')
      .select('id, booking_id')
      .eq('id', asset.run_id)
      .maybeSingle();

    if (!run) {
      return notFoundResponse();
    }

    const { data: booking } = await admin
      .from('bookings')
      .select('id, operator_organization_id, planner_organization_id')
      .eq('id', run.booking_id)
      .maybeSingle();

    if (!booking) {
      return notFoundResponse();
    }

    if (profile.role === 'operator' && booking.operator_organization_id !== profile.organization_id) {
      return notFoundResponse();
    }

    if (profile.role === 'planner' && booking.planner_organization_id !== profile.organization_id) {
      return notFoundResponse();
    }
  }

  const { data: signedUrl, error } = await admin.storage
    .from('proof-uploads')
    .createSignedUrl(asset.storage_path, 60);

  if (error || !signedUrl?.signedUrl) {
    return new NextResponse('Unable to open proof asset.', { status: 500 });
  }

  return NextResponse.redirect(signedUrl.signedUrl);
}
