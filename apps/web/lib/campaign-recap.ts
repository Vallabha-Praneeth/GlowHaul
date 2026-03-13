import { recordIdSchema } from '@glowhaul/core';
import type { Database } from '../../../packages/supabase/types/database';
import { requireAuthenticatedProfile, roleHomePath, type AppRole } from './auth';
import {
  formatCurrency,
  formatOptionalDateTime,
  formatPlural,
  formatStatus,
  formatTimeWindow,
  getFileName,
  getProofAssetHref,
  getStatusTone,
} from './formatters';
import { createAdminSupabaseClient } from './supabase/admin';

type BadgeTone = 'success' | 'warning';
type BookingRow = Database['public']['Tables']['bookings']['Row'];
type OrganizationRow = Database['public']['Tables']['organizations']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProofAssetRow = Database['public']['Tables']['proof_assets']['Row'];
type RunRow = Database['public']['Tables']['runs']['Row'];
type SlotRow = Database['public']['Tables']['slots']['Row'];
type TruckRow = Database['public']['Tables']['trucks']['Row'];

export type CampaignRecapTimelineItem = {
  detail: string;
  id: string;
  label: string;
  timeLabel: string;
  tone: BadgeTone;
};

export type CampaignRecapProofItem = {
  assetHref: string;
  capturedAtLabel: string;
  driverLabel: string;
  fileName: string;
  id: string;
  reviewNotes: string | null;
  reviewedAtLabel: string | null;
  statusLabel: string;
  tone: BadgeTone;
};

export type CampaignRecapData = {
  backHref: string;
  campaignName: string;
  campaignSummary: string;
  internalNote: string | null;
  issueSummary: string | null;
  lastUpdatedLabel: string;
  operatorLabel: string;
  plannerLabel: string;
  proofItems: CampaignRecapProofItem[];
  proofSummary: string;
  routeSummary: string;
  shareReadyCallout: string;
  stageLabel: string;
  stageTone: BadgeTone;
  timeline: CampaignRecapTimelineItem[];
  viewerRole: AppRole;
};

function buildStageSummary(
  booking: Pick<BookingRow, 'status'>,
  run: Pick<RunRow, 'issue_note' | 'proof_required' | 'status'> | null,
  latestProof: Pick<ProofAssetRow, 'status'> | null,
  proofCount: number,
) {
  if (booking.status === 'cancelled') {
    return {
      shareReadyCallout: 'This campaign was cancelled. Keep the recap for internal closeout only.',
      stageLabel: 'Cancelled',
      stageTone: 'warning' as const,
    };
  }

  if (latestProof?.status === 'approved') {
    return {
      shareReadyCallout: 'Approved proof is ready to share with the planner or client.',
      stageLabel: 'Client-ready',
      stageTone: 'success' as const,
    };
  }

  if (latestProof?.status === 'uploaded') {
    return {
      shareReadyCallout: 'Proof is uploaded and waiting on operator review before share-out.',
      stageLabel: 'Proof review',
      stageTone: 'warning' as const,
    };
  }

  if (latestProof?.status === 'rejected') {
    return {
      shareReadyCallout: 'The latest proof was rejected. A reshoot is required before final closeout.',
      stageLabel: 'Proof follow-up',
      stageTone: 'warning' as const,
    };
  }

  if (!run) {
    return {
      shareReadyCallout: 'The booking is confirmed, but dispatch details are not fully locked yet.',
      stageLabel: 'Dispatch pending',
      stageTone: 'warning' as const,
    };
  }

  if (run.status === 'issue') {
    return {
      shareReadyCallout: run.issue_note
        ? `Execution is paused on an issue: ${run.issue_note}`
        : 'Execution is paused on an issue that still needs resolution.',
      stageLabel: 'Issue',
      stageTone: 'warning' as const,
    };
  }

  if (run.status === 'live') {
    return {
      shareReadyCallout: run.proof_required
        ? 'The route is live. Proof is still required before completion.'
        : 'The route is live and no proof is required for completion.',
      stageLabel: 'Live',
      stageTone: 'success' as const,
    };
  }

  if (run.status === 'en_route') {
    return {
      shareReadyCallout: 'The truck is rolling to the route. Final proof and closeout come next.',
      stageLabel: 'En route',
      stageTone: 'warning' as const,
    };
  }

  if (run.status === 'assigned') {
    return {
      shareReadyCallout: 'Driver is assigned and the campaign is ready for launch.',
      stageLabel: 'Scheduled',
      stageTone: 'success' as const,
    };
  }

  return {
    shareReadyCallout:
      proofCount > 0
        ? 'Execution is complete. Use the proof log below for final share-out.'
        : 'Execution is complete. Add proof if the planner still needs client-facing evidence.',
    stageLabel: 'Closed',
    stageTone: 'success' as const,
  };
}

function buildTimeline(
  booking: Pick<BookingRow, 'created_at' | 'status' | 'updated_at'>,
  runs: Pick<
    RunRow,
    'driver_id' | 'id' | 'issue_note' | 'issue_reported_at' | 'issue_resolved_at' | 'proof_required' | 'scheduled_end_at' | 'scheduled_start_at' | 'status'
  >[],
  proofs: Pick<
    ProofAssetRow,
    'captured_at' | 'created_at' | 'driver_id' | 'id' | 'review_notes' | 'reviewed_at' | 'run_id' | 'status' | 'storage_path'
  >[],
  driverMap: Map<string, Pick<ProfileRow, 'email' | 'full_name' | 'id'>>,
) {
  const timeline = [
    {
      detail: `Campaign booking is ${formatStatus(booking.status)}.`,
      id: 'booking-created',
      label: `Booking ${formatStatus(booking.status)}`,
      sortKey: new Date(booking.created_at ?? booking.updated_at).getTime(),
      timeLabel: formatOptionalDateTime(booking.created_at ?? booking.updated_at) ?? 'Recently',
      tone: getStatusTone(booking.status),
    },
  ];

  runs.forEach((run) => {
    const driver = run.driver_id ? driverMap.get(run.driver_id) : null;
    timeline.push({
      detail: `${formatTimeWindow(run.scheduled_start_at, run.scheduled_end_at)} • ${driver?.full_name ?? driver?.email ?? 'Assigned driver'} • ${
        run.proof_required ? 'Proof required' : 'Proof optional'
      }`,
      id: `run-${run.id}`,
      label: `Run ${formatStatus(run.status)}`,
      sortKey: new Date(run.scheduled_start_at).getTime(),
      timeLabel: formatOptionalDateTime(run.scheduled_start_at) ?? 'Scheduled',
      tone: getStatusTone(run.status),
    });

    if (run.issue_reported_at) {
      timeline.push({
        detail: run.issue_note ?? 'Execution issue reported.',
        id: `run-issue-${run.id}`,
        label: 'Issue reported',
        sortKey: new Date(run.issue_reported_at).getTime(),
        timeLabel: formatOptionalDateTime(run.issue_reported_at) ?? 'Reported',
        tone: 'warning' as const,
      });
    }

    if (run.issue_resolved_at) {
      timeline.push({
        detail: run.issue_note ?? 'Execution issue resolved.',
        id: `run-resolved-${run.id}`,
        label: 'Issue resolved',
        sortKey: new Date(run.issue_resolved_at).getTime(),
        timeLabel: formatOptionalDateTime(run.issue_resolved_at) ?? 'Resolved',
        tone: 'success' as const,
      });
    }
  });

  proofs.forEach((proof) => {
    const driver = driverMap.get(proof.driver_id);
    const capturedAt = proof.captured_at ?? proof.created_at;

    timeline.push({
      detail: `${getFileName(proof.storage_path)} • ${driver?.full_name ?? driver?.email ?? 'Assigned driver'}`,
      id: `proof-uploaded-${proof.id}`,
      label: `Proof ${formatStatus(proof.status)}`,
      sortKey: new Date(capturedAt).getTime(),
      timeLabel: formatOptionalDateTime(capturedAt) ?? 'Uploaded',
      tone: getStatusTone(proof.status),
    });

    if (proof.reviewed_at) {
      timeline.push({
        detail: proof.review_notes ?? 'Operator completed proof review.',
        id: `proof-reviewed-${proof.id}`,
        label: `Proof review ${formatStatus(proof.status)}`,
        sortKey: new Date(proof.reviewed_at).getTime(),
        timeLabel: formatOptionalDateTime(proof.reviewed_at) ?? 'Reviewed',
        tone: getStatusTone(proof.status),
      });
    }
  });

  return timeline
    .sort((left, right) => left.sortKey - right.sortKey)
    .map(({ sortKey: _sortKey, ...item }) => item);
}

export async function getCampaignRecapData(bookingId: string): Promise<CampaignRecapData | null> {
  if (!recordIdSchema.safeParse(bookingId).success) {
    return null;
  }

  const profile = await requireAuthenticatedProfile();
  const admin = createAdminSupabaseClient();

  if (!admin) {
    return null;
  }

  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .select(
      'id, campaign_name, status, internal_note, operator_organization_id, planner_organization_id, slot_id, created_at, updated_at'
    )
    .eq('id', bookingId)
    .maybeSingle();

  if (bookingError || !booking) {
    return null;
  }

  if (profile.role === 'operator' && booking.operator_organization_id !== profile.organization_id) {
    return null;
  }

  if (profile.role === 'planner' && booking.planner_organization_id !== profile.organization_id) {
    return null;
  }

  const [slotResult, runsResult, organizationsResult] = await Promise.all([
    admin
      .from('slots')
      .select('id, truck_id, region, start_at, end_at, rate_cents, status, campaign_notes')
      .eq('id', booking.slot_id)
      .maybeSingle(),
    admin
      .from('runs')
      .select(
        'id, booking_id, driver_id, issue_note, issue_reported_at, issue_resolved_at, scheduled_start_at, scheduled_end_at, status, proof_required'
      )
      .eq('booking_id', booking.id)
      .order('scheduled_start_at'),
    admin
      .from('organizations')
      .select('id, name')
      .in('id', [booking.operator_organization_id, booking.planner_organization_id]),
  ]);

  if (slotResult.error || runsResult.error || organizationsResult.error) {
    return null;
  }

  const slot = slotResult.data as Pick<
    SlotRow,
    'campaign_notes' | 'end_at' | 'id' | 'rate_cents' | 'region' | 'start_at' | 'status' | 'truck_id'
  > | null;
  const runs = (runsResult.data ?? []) as Pick<
    RunRow,
    | 'booking_id'
    | 'driver_id'
    | 'id'
    | 'issue_note'
    | 'issue_reported_at'
    | 'issue_resolved_at'
    | 'proof_required'
    | 'scheduled_end_at'
    | 'scheduled_start_at'
    | 'status'
  >[];

  if (profile.role === 'driver' && !runs.some((run) => run.driver_id === profile.id)) {
    return null;
  }

  const runIds = runs.map((run) => run.id);
  const driverIds = Array.from(new Set(runs.map((run) => run.driver_id).filter(Boolean))) as string[];

  const [truckResult, proofsResult, driversResult] = await Promise.all([
    slot
      ? admin
          .from('trucks')
          .select('id, display_name, vehicle_code')
          .eq('id', slot.truck_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    runIds.length > 0
      ? admin
          .from('proof_assets')
          .select('id, run_id, driver_id, storage_path, captured_at, created_at, status, review_notes, reviewed_at')
          .in('run_id', runIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    driverIds.length > 0
      ? admin.from('profiles').select('id, email, full_name').in('id', driverIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (truckResult.error || proofsResult.error || driversResult.error) {
    return null;
  }

  const truck = truckResult.data as Pick<TruckRow, 'display_name' | 'id' | 'vehicle_code'> | null;
  const proofs = (proofsResult.data ?? []) as Pick<
    ProofAssetRow,
    'captured_at' | 'created_at' | 'driver_id' | 'id' | 'review_notes' | 'reviewed_at' | 'run_id' | 'status' | 'storage_path'
  >[];
  const driverMap = new Map(
    ((driversResult.data ?? []) as Pick<ProfileRow, 'email' | 'full_name' | 'id'>[]).map((driver) => [driver.id, driver]),
  );
  const organizationMap = new Map(
    ((organizationsResult.data ?? []) as Pick<OrganizationRow, 'id' | 'name'>[]).map((organization) => [organization.id, organization]),
  );

  const latestRun = runs[runs.length - 1] ?? null;
  const latestProof = proofs[0] ?? null;
  const approvedProofs = proofs.filter((proof) => proof.status === 'approved');
  const proofSummary =
    proofs.length > 0
      ? `${formatPlural(proofs.length, 'proof')} logged • ${formatPlural(approvedProofs.length, 'proof')} approved`
      : latestRun?.proof_required
        ? 'Proof required • Awaiting first upload'
        : 'No proof uploaded';
  const stageSummary = buildStageSummary(booking, latestRun, latestProof, proofs.length);
  const routeSummary = slot
    ? `${slot.region} • ${formatTimeWindow(slot.start_at, slot.end_at)} • ${formatCurrency(slot.rate_cents)}`
    : 'Route summary unavailable';
  const timeline = buildTimeline(booking, runs, proofs, driverMap);
  const issueSummary =
    latestRun?.issue_note
      ? `${latestRun.issue_note}${latestRun.issue_resolved_at ? ` • Resolved ${formatOptionalDateTime(latestRun.issue_resolved_at)}` : ''}`
      : null;

  return {
    backHref: roleHomePath[profile.role],
    campaignName: booking.campaign_name,
    campaignSummary: truck
      ? `${truck.display_name} (${truck.vehicle_code}) • ${formatStatus(booking.status)}`
      : formatStatus(booking.status),
    internalNote: booking.internal_note ?? slot?.campaign_notes ?? null,
    issueSummary,
    lastUpdatedLabel: formatOptionalDateTime(booking.updated_at) ?? 'Recently',
    operatorLabel: organizationMap.get(booking.operator_organization_id)?.name ?? 'Operator organization',
    plannerLabel: organizationMap.get(booking.planner_organization_id)?.name ?? 'Planner organization',
    proofItems: proofs.map((proof) => ({
      assetHref: getProofAssetHref(proof.id),
      capturedAtLabel: formatOptionalDateTime(proof.captured_at ?? proof.created_at) ?? 'Recently',
      driverLabel: driverMap.get(proof.driver_id)?.full_name ?? driverMap.get(proof.driver_id)?.email ?? 'Assigned driver',
      fileName: getFileName(proof.storage_path),
      id: proof.id,
      reviewNotes: proof.review_notes,
      reviewedAtLabel: formatOptionalDateTime(proof.reviewed_at),
      statusLabel: formatStatus(proof.status),
      tone: getStatusTone(proof.status),
    })),
    proofSummary,
    routeSummary,
    shareReadyCallout: stageSummary.shareReadyCallout,
    stageLabel: stageSummary.stageLabel,
    stageTone: stageSummary.stageTone,
    timeline,
    viewerRole: profile.role,
  };
}
