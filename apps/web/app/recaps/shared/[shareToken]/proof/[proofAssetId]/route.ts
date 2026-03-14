import { NextRequest, NextResponse } from 'next/server';
import { campaignRecapShareTokenSchema, recordIdSchema } from '@glowhaul/core';
import { createAdminSupabaseClient } from '../../../../../../lib/supabase/admin';

function notFoundResponse() {
  return new NextResponse('Not found', { status: 404 });
}

function serverErrorResponse(message = 'Unable to open proof asset.') {
  return new NextResponse(message, { status: 500 });
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ proofAssetId: string; shareToken: string }> }
) {
  const { proofAssetId, shareToken } = await context.params;

  if (
    !recordIdSchema.safeParse(proofAssetId).success ||
    !campaignRecapShareTokenSchema.safeParse(shareToken).success
  ) {
    return notFoundResponse();
  }

  const admin = createAdminSupabaseClient();

  if (!admin) {
    console.error('Public proof asset route unavailable: Supabase admin client is not configured.');
    return new NextResponse('Service temporarily unavailable.', { status: 503 });
  }

  const { data: share, error: shareError } = await admin
    .from('campaign_recap_shares')
    .select('booking_id')
    .eq('token', shareToken)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (shareError) {
    return serverErrorResponse();
  }

  if (!share) {
    return notFoundResponse();
  }

  const { data: asset, error: assetError } = await admin
    .from('proof_assets')
    .select('id, run_id, status, storage_path')
    .eq('id', proofAssetId)
    .eq('status', 'approved')
    .maybeSingle();

  if (assetError) {
    return serverErrorResponse();
  }

  if (!asset) {
    return notFoundResponse();
  }

  const { data: run, error: runError } = await admin
    .from('runs')
    .select('booking_id')
    .eq('id', asset.run_id)
    .maybeSingle();

  if (runError) {
    return serverErrorResponse();
  }

  if (!run || run.booking_id !== share.booking_id) {
    return notFoundResponse();
  }

  const { data: signedUrl, error } = await admin.storage
    .from('proof-uploads')
    .createSignedUrl(asset.storage_path, 60);

  if (error || !signedUrl?.signedUrl) {
    return serverErrorResponse();
  }

  return NextResponse.redirect(signedUrl.signedUrl);
}
