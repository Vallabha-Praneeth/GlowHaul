import { campaignRecapShareTokenSchema, recordIdSchema } from '@glowhaul/core';
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
import { getAppOrigin } from './site-url';
import { createAdminSupabaseClient } from './supabase/admin';

type BadgeTone = 'success' | 'warning';
type BookingRow = Database['public']['Tables']['bookings']['Row'];
type OrganizationRow = Database['public']['Tables']['organizations']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProofAssetRow = Database['public']['Tables']['proof_assets']['Row'];
type RecapShareRow = Database['public']['Tables']['campaign_recap_shares']['Row'];
type RunRow = Database['public']['Tables']['runs']['Row'];
type SlotRow = Database['public']['Tables']['slots']['Row'];
type TruckRow = Database['public']['Tables']['trucks']['Row'];

type RecapAdminClient = NonNullable<ReturnType<typeof createAdminSupabaseClient>>;

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

export type CampaignRecapShareLink = {
  expiresAtLabel: string;
  url: string;
};

export type CampaignRecapData = {
  backHref: string;
  canCreatePublicShare: boolean;
  canManageCloseout: boolean;
  canMarkClientReady: boolean;
  canMarkClosed: boolean;
  campaignName: string;
  campaignSummary: string;
  closeoutLabel: string;
  closeoutNote: string | null;
  closeoutTone: BadgeTone;
  internalNote: string | null;
  issueSummary: string | null;
  lastUpdatedLabel: string;
  operatorLabel: string;
  plannerLabel: string;
  proofItems: CampaignRecapProofItem[];
  proofSummary: string;
  publicShare: CampaignRecapShareLink | null;
  routeSummary: string;
  shareReadyCallout: string;
  stageLabel: string;
  stageTone: BadgeTone;
  timeline: CampaignRecapTimelineItem[];
  viewerRole: AppRole;
};

export type PublicCampaignRecapData = {
  campaignName: string;
  campaignSummary: string;
  closeoutNote: string | null;
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
};

type SnapshotBooking = Pick<
  BookingRow,
  | 'campaign_name'
  | 'client_ready_at'
  | 'closeout_note'
  | 'closed_at'
  | 'id'
  | 'internal_note'
  | 'operator_organization_id'
  | 'planner_organization_id'
  | 'slot_id'
  | 'status'
  | 'updated_at'
  | 'created_at'
>;

type SnapshotRun = Pick<
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
>;

type SnapshotProof = Pick<
  ProofAssetRow,
  | 'captured_at'
  | 'created_at'
  | 'driver_id'
  | 'id'
  | 'review_notes'
  | 'reviewed_at'
  | 'run_id'
  | 'status'
  | 'storage_path'
>;

type Snapshot = {
  activeShare: Pick<RecapShareRow, 'expires_at' | 'token'> | null;
  booking: SnapshotBooking;
  driverMap: Map<string, Pick<ProfileRow, 'email' | 'full_name' | 'id'>>;
  organizationMap: Map<string, Pick<OrganizationRow, 'id' | 'name'>>;
  proofs: SnapshotProof[];
  runs: SnapshotRun[];
  slot: Pick<SlotRow, 'campaign_notes' | 'end_at' | 'id' | 'rate_cents' | 'region' | 'start_at' | 'status' | 'truck_id'> | null;
  truck: Pick<TruckRow, 'display_name' | 'id' | 'vehicle_code'> | null;
};

function buildAnonymizedDriverMap(
  driverMap: Map<string, Pick<ProfileRow, 'email' | 'full_name' | 'id'>>
) {
  return new Map(
    Array.from(driverMap.entries()).map(([driverId, driver], index) => [
      driverId,
      {
        ...driver,
        full_name: `Driver #${index + 1}`,
      },
    ])
  );
}

function getCloseoutLabel(booking: Pick<SnapshotBooking, 'client_ready_at' | 'closed_at' | 'status'>) {
  if (booking.closed_at) {
    return 'Closed';
  }

  if (booking.status === 'cancelled') {
    return 'Cancelled';
  }

  if (booking.client_ready_at) {
    return 'Client-ready';
  }

  return 'Execution complete';
}

function buildStageSummary(
  booking: Pick<SnapshotBooking, 'client_ready_at' | 'closed_at' | 'status'>,
  run: Pick<SnapshotRun, 'issue_note' | 'proof_required' | 'status'> | null,
  latestProof: Pick<SnapshotProof, 'status'> | null,
  proofCount: number,
) {
  if (booking.closed_at) {
    return {
      shareReadyCallout: 'Campaign closeout is complete. Use this recap as the final archive artifact.',
      stageLabel: 'Closed',
      stageTone: 'success' as const,
    };
  }

  if (booking.status === 'cancelled') {
    return {
      shareReadyCallout: 'This campaign was cancelled. Keep the recap for internal closeout only.',
      stageLabel: 'Cancelled',
      stageTone: 'warning' as const,
    };
  }

  if (booking.client_ready_at) {
    return {
      shareReadyCallout: 'Campaign is marked client-ready. You can print the recap or use the public share link.',
      stageLabel: 'Client-ready',
      stageTone: 'success' as const,
    };
  }

  if (latestProof?.status === 'approved') {
    return {
      shareReadyCallout: 'Approved proof is ready. Mark the campaign client-ready before sending it externally.',
      stageLabel: 'Proof approved',
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
    stageLabel: 'Execution complete',
    stageTone: 'success' as const,
  };
}

function buildTimeline(
  booking: Pick<SnapshotBooking, 'client_ready_at' | 'closed_at' | 'created_at' | 'updated_at' | 'status'>,
  runs: SnapshotRun[],
  proofs: SnapshotProof[],
  driverMap: Map<string, Pick<ProfileRow, 'email' | 'full_name' | 'id'>>,
  options: { redactIssueDetails?: boolean } = {},
) {
  const timeline: Array<CampaignRecapTimelineItem & { sortKey: number }> = [
    {
      detail: 'Campaign booking was created and is now tracked in the operations workspace.',
      id: 'booking-created',
      label: 'Booking Created',
      sortKey: new Date(booking.created_at ?? booking.updated_at).getTime(),
      timeLabel: formatOptionalDateTime(booking.created_at ?? booking.updated_at) ?? 'Recently',
      tone: 'success' as const,
    },
  ];

  runs.forEach((run) => {
    const driver = run.driver_id ? driverMap.get(run.driver_id) : null;
    timeline.push({
      detail: `${formatTimeWindow(run.scheduled_start_at, run.scheduled_end_at)} • ${driver?.full_name ?? driver?.email ?? 'Assigned driver'} • ${
        run.proof_required ? 'Proof required' : 'Proof optional'
      }`,
      id: `run-${run.id}`,
      label: 'Run Scheduled',
      sortKey: new Date(run.scheduled_start_at).getTime(),
      timeLabel: formatOptionalDateTime(run.scheduled_start_at) ?? 'Scheduled',
      tone: 'success' as const,
    });

    if (run.issue_reported_at) {
      timeline.push({
        detail: options.redactIssueDetails
          ? run.issue_resolved_at
            ? 'An execution issue was reported and resolved during delivery.'
            : 'An execution issue was reported during delivery.'
          : run.issue_note ?? 'Execution issue reported.',
        id: `run-issue-${run.id}`,
        label: 'Issue reported',
        sortKey: new Date(run.issue_reported_at).getTime(),
        timeLabel: formatOptionalDateTime(run.issue_reported_at) ?? 'Reported',
        tone: 'warning' as const,
      });
    }

    if (run.issue_resolved_at) {
      timeline.push({
        detail: options.redactIssueDetails
          ? 'The reported execution issue was resolved.'
          : run.issue_note ?? 'Execution issue resolved.',
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
      label: 'Proof Uploaded',
      sortKey: new Date(capturedAt).getTime(),
      timeLabel: formatOptionalDateTime(capturedAt) ?? 'Uploaded',
      tone: 'success' as const,
    });

    if (proof.reviewed_at) {
      timeline.push({
        detail: options.redactIssueDetails
          ? `Operator completed proof review with status ${formatStatus(proof.status)}.`
          : proof.review_notes ?? 'Operator completed proof review.',
        id: `proof-reviewed-${proof.id}`,
        label: `Proof review ${formatStatus(proof.status)}`,
        sortKey: new Date(proof.reviewed_at).getTime(),
        timeLabel: formatOptionalDateTime(proof.reviewed_at) ?? 'Reviewed',
        tone: getStatusTone(proof.status),
      });
    }
  });

  if (booking.client_ready_at) {
    timeline.push({
      detail: 'Campaign was marked client-ready for final delivery.',
      id: 'client-ready',
      label: 'Client-ready',
      sortKey: new Date(booking.client_ready_at).getTime(),
      timeLabel: formatOptionalDateTime(booking.client_ready_at) ?? 'Client-ready',
      tone: 'success' as const,
    });
  }

  if (booking.closed_at) {
    timeline.push({
      detail: booking.status === 'cancelled' ? 'Cancelled campaign was archived.' : 'Campaign closeout was completed.',
      id: 'closed',
      label: 'Closed',
      sortKey: new Date(booking.closed_at).getTime(),
      timeLabel: formatOptionalDateTime(booking.closed_at) ?? 'Closed',
      tone: 'success' as const,
    });
  }

  return timeline
    .sort((left, right) => left.sortKey - right.sortKey)
    .map(({ sortKey: _sortKey, ...item }) => item);
}

function buildPublicShareHref(token: string) {
  return `${getAppOrigin()}/recaps/shared/${token}`;
}

function getPublicProofAssetHref(shareToken: string, proofAssetId: string) {
  return `/recaps/shared/${shareToken}/proof/${proofAssetId}`;
}

async function loadCampaignSnapshot(admin: RecapAdminClient, bookingId: string): Promise<Snapshot | null> {
  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .select(
      'id, campaign_name, status, internal_note, closeout_note, client_ready_at, closed_at, operator_organization_id, planner_organization_id, slot_id, created_at, updated_at'
    )
    .eq('id', bookingId)
    .maybeSingle();

  if (bookingError || !booking) {
    return null;
  }

  const [slotResult, runsResult, organizationsResult, activeShareResult] = await Promise.all([
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
    admin
      .from('campaign_recap_shares')
      .select('token, expires_at')
      .eq('booking_id', booking.id)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .maybeSingle(),
  ]);

  if (slotResult.error || runsResult.error || organizationsResult.error || activeShareResult.error) {
    return null;
  }

  const slot = slotResult.data as Snapshot['slot'];
  const runs = (runsResult.data ?? []) as SnapshotRun[];
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

  return {
    activeShare: activeShareResult.data as Pick<RecapShareRow, 'expires_at' | 'token'> | null,
    booking: booking as SnapshotBooking,
    driverMap: new Map(
      ((driversResult.data ?? []) as Pick<ProfileRow, 'email' | 'full_name' | 'id'>[]).map((driver) => [driver.id, driver]),
    ),
    organizationMap: new Map(
      ((organizationsResult.data ?? []) as Pick<OrganizationRow, 'id' | 'name'>[]).map((organization) => [organization.id, organization]),
    ),
    proofs: (proofsResult.data ?? []) as SnapshotProof[],
    runs,
    slot,
    truck: truckResult.data as Pick<TruckRow, 'display_name' | 'id' | 'vehicle_code'> | null,
  };
}

function mapProofItems(
  proofs: SnapshotProof[],
  driverMap: Map<string, Pick<ProfileRow, 'email' | 'full_name' | 'id'>>,
  options: { publicShareToken?: string; publicView?: boolean } = {},
) {
  return proofs.map((proof) => ({
    assetHref: options.publicShareToken
      ? getPublicProofAssetHref(options.publicShareToken, proof.id)
      : getProofAssetHref(proof.id),
    capturedAtLabel: formatOptionalDateTime(proof.captured_at ?? proof.created_at) ?? 'Recently',
    driverLabel: driverMap.get(proof.driver_id)?.full_name ?? driverMap.get(proof.driver_id)?.email ?? 'Assigned driver',
    fileName: getFileName(proof.storage_path),
    id: proof.id,
    reviewNotes: options.publicView ? null : proof.review_notes,
    reviewedAtLabel: formatOptionalDateTime(proof.reviewed_at),
    statusLabel: formatStatus(proof.status),
    tone: getStatusTone(proof.status),
  }));
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

  const snapshot = await loadCampaignSnapshot(admin, bookingId);

  if (!snapshot) {
    return null;
  }

  const { activeShare, booking, driverMap, organizationMap, proofs, runs, slot, truck } = snapshot;

  if (profile.role === 'operator' && booking.operator_organization_id !== profile.organization_id) {
    return null;
  }

  if (profile.role === 'planner' && booking.planner_organization_id !== profile.organization_id) {
    return null;
  }

  if (profile.role === 'driver' && !runs.some((run) => run.driver_id === profile.id)) {
    return null;
  }

  const latestRun = runs[runs.length - 1] ?? null;
  const latestProof =
    latestRun
      ? proofs.find((proof) => proof.run_id === latestRun.id) ?? null
      : null;
  const latestRunHasApprovedProof = latestRun
    ? proofs.some((proof) => proof.run_id === latestRun.id && proof.status === 'approved')
    : false;
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
  const canManageCloseout = profile.role === 'operator' || profile.role === 'planner';
  const canMarkClientReady =
    canManageCloseout &&
    booking.status === 'completed' &&
    !booking.client_ready_at &&
    !booking.closed_at &&
    (!latestRun?.proof_required || latestRunHasApprovedProof);
  const canMarkClosed =
    canManageCloseout &&
    !booking.closed_at &&
    (booking.status === 'cancelled' || booking.client_ready_at !== null);

  return {
    backHref: roleHomePath[profile.role],
    canCreatePublicShare: canManageCloseout && booking.status === 'completed' && booking.client_ready_at !== null,
    canManageCloseout,
    canMarkClientReady,
    canMarkClosed,
    campaignName: booking.campaign_name,
    campaignSummary: truck
      ? `${truck.display_name} (${truck.vehicle_code}) • ${formatStatus(booking.status)}`
      : formatStatus(booking.status),
    closeoutLabel: getCloseoutLabel(booking),
    closeoutNote: booking.closeout_note,
    closeoutTone: booking.closed_at || booking.client_ready_at ? 'success' : 'warning',
    internalNote:
      profile.role === 'driver'
        ? slot?.campaign_notes ?? booking.closeout_note ?? null
        : booking.internal_note ?? slot?.campaign_notes ?? null,
    issueSummary,
    lastUpdatedLabel: formatOptionalDateTime(booking.closed_at ?? booking.client_ready_at ?? booking.updated_at) ?? 'Recently',
    operatorLabel: organizationMap.get(booking.operator_organization_id)?.name ?? 'Operator organization',
    plannerLabel: organizationMap.get(booking.planner_organization_id)?.name ?? 'Planner organization',
    proofItems: mapProofItems(proofs, driverMap),
    proofSummary,
    publicShare: activeShare
      ? {
          expiresAtLabel: formatOptionalDateTime(activeShare.expires_at) ?? 'Soon',
          url: buildPublicShareHref(activeShare.token),
        }
      : null,
    routeSummary,
    shareReadyCallout: stageSummary.shareReadyCallout,
    stageLabel: stageSummary.stageLabel,
    stageTone: stageSummary.stageTone,
    timeline,
    viewerRole: profile.role,
  };
}

export async function getPublicCampaignRecapData(shareToken: string): Promise<PublicCampaignRecapData | null> {
  if (!campaignRecapShareTokenSchema.safeParse(shareToken).success) {
    return null;
  }

  const admin = createAdminSupabaseClient();

  if (!admin) {
    return null;
  }

  const { data: share, error: shareError } = await admin
    .from('campaign_recap_shares')
    .select('booking_id, token, expires_at')
    .eq('token', shareToken)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (shareError || !share) {
    return null;
  }

  const snapshot = await loadCampaignSnapshot(admin, share.booking_id);

  if (!snapshot) {
    return null;
  }

  const { booking, driverMap, organizationMap, proofs, runs, slot, truck } = snapshot;

  if (booking.status !== 'completed' || booking.client_ready_at === null) {
    return null;
  }

  const publicProofs = proofs.filter((proof) => proof.status === 'approved');
  const latestRun = runs[runs.length - 1] ?? null;
  const latestProof =
    latestRun
      ? publicProofs.find((proof) => proof.run_id === latestRun.id) ?? null
      : null;
  const anonymizedDriverMap = buildAnonymizedDriverMap(driverMap);
  const routeSummary = slot
    ? `${slot.region} • ${formatTimeWindow(slot.start_at, slot.end_at)} • ${formatCurrency(slot.rate_cents)}`
    : 'Route summary unavailable';
  const timeline = buildTimeline(booking, runs, publicProofs, anonymizedDriverMap, { redactIssueDetails: true });
  const stageSummary = buildStageSummary(booking, latestRun, latestProof, publicProofs.length);

  await admin
    .from('campaign_recap_shares')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('token', shareToken);

  return {
    campaignName: booking.campaign_name,
    campaignSummary: truck
      ? `${truck.display_name} (${truck.vehicle_code}) • ${formatStatus(booking.status)}`
      : formatStatus(booking.status),
    closeoutNote: booking.closeout_note ?? null,
    lastUpdatedLabel: formatOptionalDateTime(booking.closed_at ?? booking.client_ready_at ?? share.expires_at) ?? 'Recently',
    operatorLabel: organizationMap.get(booking.operator_organization_id)?.name ?? 'Operator organization',
    plannerLabel: organizationMap.get(booking.planner_organization_id)?.name ?? 'Planner organization',
    proofItems: mapProofItems(publicProofs, anonymizedDriverMap, { publicShareToken: shareToken, publicView: true }),
    proofSummary:
      publicProofs.length > 0
        ? `${formatPlural(publicProofs.length, 'approved proof')} ready for review`
        : latestRun?.proof_required
          ? 'Approved proof will appear here after operator review.'
          : 'No proof required for the latest run.',
    routeSummary,
    shareReadyCallout:
      publicProofs.length > 0
        ? 'This public recap includes only approved proof and closeout-safe campaign context.'
        : stageSummary.shareReadyCallout,
    stageLabel: booking.closed_at ? 'Closed' : 'Client-ready',
    stageTone: 'success',
    timeline,
  };
}
