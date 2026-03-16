import type { Database } from '../../../packages/supabase/types/database';
import { requireAuthenticatedProfile } from './auth';
import {
  dateFormatter,
  dateTimeFormatter,
  formatCurrency,
  formatOptionalDateTime,
  formatPlural,
  formatStatus,
  formatTimeWindow,
  getFileName,
  getProofAssetHref,
  getStatusTone,
  timeFormatter,
} from './formatters';
import { createServerSupabaseClient } from './supabase/server';

type BadgeTone = 'success' | 'warning';
type BookingRow = Database['public']['Tables']['bookings']['Row'];
type OfferRow = Database['public']['Tables']['offers']['Row'];
type OrganizationRow = Database['public']['Tables']['organizations']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProofAssetRow = Database['public']['Tables']['proof_assets']['Row'];
type RegionCode = Database['public']['Enums']['region_code'];
type RunRow = Database['public']['Tables']['runs']['Row'];
type SlotRow = Database['public']['Tables']['slots']['Row'];
type SlotStatus = Database['public']['Enums']['slot_status'];
type TruckRow = Database['public']['Tables']['trucks']['Row'];

export type DashboardKpi = {
  label: string;
  value: string;
};

export type DashboardAttentionItem = {
  actionLabel: string;
  detail: string;
  id: string;
  title: string;
  tone: BadgeTone;
};

export type HistoryArchiveStatusFilter = 'all' | 'cancelled' | 'client_ready' | 'closed';
export type HistoryArchiveProofFilter = 'all' | 'approved' | 'missing' | 'rejected';
export type HistoryArchiveFilters = {
  proof: HistoryArchiveProofFilter;
  query: string;
  region: 'all' | RegionCode;
  status: HistoryArchiveStatusFilter;
};

export type HistoryFilterPill = {
  label: string;
  value: string;
};

export type DashboardHistoryItem = {
  closeoutLabel: string;
  dateLabel: string;
  detail: string;
  id: string;
  proofLabel: string | null;
  proofStatus: ProofAssetRow['status'] | null;
  recapHref: string;
  region: RegionCode | null;
  statusLabel: string;
  tone: BadgeTone;
  title: string;
};

export type OperatorTruckOption = {
  homeRegion: RegionCode;
  id: string;
  label: string;
};

export type OperatorInventorySlot = {
  campaignNotes: string;
  id: string;
  rateDollars: string;
  region: RegionCode;
  startAtInput: string;
  status: SlotStatus;
  summary: string;
  truckId: string;
  truckLabel: string;
  endAtInput: string;
};

export type OperatorIncomingOffer = {
  amountLabel: string;
  canAccept: boolean;
  canReject: boolean;
  createdLabel: string;
  id: string;
  message: string | null;
  operatorNote: string | null;
  plannerLabel: string;
  slotDetail: string;
  slotTitle: string;
  statusLabel: string;
};

export type OperatorActiveBooking = {
  bookingId: string;
  bookingStatus: BookingRow['status'];
  campaignName: string;
  dispatchStageLabel: string;
  dispatchStageTone: BadgeTone;
  dispatchEndAtInput: string;
  dispatchStartAtInput: string;
  driverId: string;
  driverLabel: string;
  internalNote: string;
  issueNote: string;
  issueReportedAtLabel: string | null;
  issueResolvedAtLabel: string | null;
  latestProofStatusLabel: string;
  nextAction: string;
  plannerLabel: string;
  proofReviewLabel: string;
  proofReviewTone: BadgeTone;
  proofRequired: boolean;
  proofCountLabel: string;
  recapHref: string;
  runId: string | null;
  runStatus: RunRow['status'] | null;
  scheduleLabel: string;
  slotTitle: string;
};

export type OperatorDriverOption = {
  id: string;
  label: string;
};

export type OperatorProofReview = {
  assetUrl: string | null;
  canReview: boolean;
  driverLabel: string;
  fileName: string;
  id: string;
  nextAction: string;
  reviewNotes: string;
  reviewedAtLabel: string | null;
  reviewTone: BadgeTone;
  runTitle: string;
  statusLabel: string;
  uploadedAtLabel: string;
};

export type OperatorDashboardData = {
  activeBookings: OperatorActiveBooking[];
  attentionQueue: DashboardAttentionItem[];
  badgeLabel: string;
  badgeTone: BadgeTone;
  driverOptions: OperatorDriverOption[];
  healthSummary: DashboardKpi[];
  historyFilterPills: HistoryFilterPill[];
  historyFilters: HistoryArchiveFilters;
  incomingOffers: OperatorIncomingOffer[];
  inventorySlots: OperatorInventorySlot[];
  kpis: DashboardKpi[];
  proofReviews: OperatorProofReview[];
  recentHistory: DashboardHistoryItem[];
  sourceLabel: string;
  title: string;
  truckOptions: OperatorTruckOption[];
};

export type PlannerAvailabilityFilter = 'all' | 'booked' | 'open';
export type PlannerSortOption = 'price_high' | 'price_low' | 'soonest';

export type PlannerMarketplaceFilters = {
  availability: PlannerAvailabilityFilter;
  query: string;
  region: 'all' | RegionCode;
  sort: PlannerSortOption;
};

export type PlannerFilterPill = {
  label: string;
  value: string;
};

export type PlannerAvailableSlot = {
  bookingLabel: string | null;
  detail: string;
  executionLabel: string | null;
  id: string;
  isActionLocked: boolean;
  message: string | null;
  operatorNote: string | null;
  proofLabel: string | null;
  proofTone: BadgeTone | null;
  rateDollars: string;
  status: SlotStatus;
  statusLabel: string;
  statusTone: BadgeTone;
  submittedOfferStatus: string | null;
  title: string;
};

export type PlannerSubmittedOffer = {
  amountLabel: string;
  bookingLabel: string | null;
  campaignStageLabel: string;
  campaignStageTone: BadgeTone;
  executionLabel: string | null;
  id: string;
  issueNote: string | null;
  issueUpdatedLabel: string | null;
  message: string | null;
  nextAction: string;
  operatorNote: string | null;
  proofLabel: string | null;
  proofTone: BadgeTone | null;
  recapHref: string | null;
  slotTitle: string;
  statusLabel: string;
  statusTone: BadgeTone;
  timeline: string[];
  updatedLabel: string;
};

export type PlannerMarketplaceData = {
  attentionQueue: DashboardAttentionItem[];
  availableSlots: PlannerAvailableSlot[];
  badgeLabel: string;
  filterPills: PlannerFilterPill[];
  filterState: PlannerMarketplaceFilters;
  healthSummary: DashboardKpi[];
  historyFilterPills: HistoryFilterPill[];
  historyFilters: HistoryArchiveFilters;
  recentHistory: DashboardHistoryItem[];
  regions: RegionCode[];
  sourceLabel: string;
  submittedOffers: PlannerSubmittedOffer[];
  trackerSummary: DashboardKpi[];
  title: string;
};

export type DriverAssignedRun = {
  bookingStatusLabel: string;
  detail: string;
  id: string;
  issueNote: string | null;
  issueReportedAtLabel: string | null;
  issueResolvedAtLabel: string | null;
  latestProofReviewNotes: string | null;
  latestProofStatusLabel: string;
  proofActionCallout: string;
  proofActionTone: BadgeTone;
  proofCount: number;
  proofCountLabel: string;
  proofRequired: boolean;
  recapHref: string;
  runStatus: RunRow['status'];
  statusLabel: string;
  title: string;
};

export type DriverUploadedProof = {
  assetUrl: string | null;
  capturedAtLabel: string;
  fileName: string;
  id: string;
  nextAction: string;
  reviewNotes: string | null;
  reviewedAtLabel: string | null;
  runTitle: string;
  statusLabel: string;
  tone: BadgeTone;
};

export type DriverWorkspaceData = {
  attentionQueue: DashboardAttentionItem[];
  assignedRuns: DriverAssignedRun[];
  badgeLabel: string;
  badgeTone: BadgeTone;
  historyFilterPills: HistoryFilterPill[];
  historyFilters: HistoryArchiveFilters;
  proofCallout: string;
  proofUploads: DriverUploadedProof[];
  recentHistory: DashboardHistoryItem[];
  shiftSummary: DashboardKpi[];
  sourceLabel: string;
  title: string;
};

function formatDateTimeInput(isoValue: string) {
  return new Date(isoValue).toISOString().slice(0, 16);
}

function isWithinHours(isoValue: string, hours: number) {
  const delta = new Date(isoValue).getTime() - Date.now();
  return delta >= 0 && delta <= hours * 60 * 60 * 1000;
}

function isPastDue(isoValue: string) {
  return new Date(isoValue).getTime() < Date.now();
}

function getCampaignRecapHref(bookingId: string) {
  return `/campaigns/${bookingId}`;
}

function getHistoryCloseoutLabel(
  booking: Pick<BookingRow, 'status'> & {
    client_ready_at?: string | null;
    closed_at?: string | null;
  }
) {
  if (booking.closed_at) {
    return 'Closed';
  }

  if (booking.status === 'cancelled') {
    return 'Cancelled';
  }

  if (booking.client_ready_at) {
    return 'Client-ready';
  }

  return booking.status === 'completed' ? 'Completed' : formatStatus(booking.status);
}

function matchesHistoryFilters(
  item: {
    closeoutLabel: string;
    detail: string;
    proofLabel: string | null;
    proofStatus: ProofAssetRow['status'] | null;
    region: RegionCode | null;
    statusLabel: string;
    title: string;
  },
  filters: HistoryArchiveFilters
) {
  const query = filters.query.trim().toLowerCase();

  if (query) {
    const searchable = [
      item.title,
      item.detail,
      item.region ?? '',
      item.closeoutLabel,
      item.statusLabel,
      item.proofLabel ?? '',
      item.proofStatus ? formatStatus(item.proofStatus) : 'Missing proof',
    ]
      .join(' ')
      .toLowerCase();

    if (!searchable.includes(query)) {
      return false;
    }
  }

  if (filters.region !== 'all' && item.region !== filters.region) {
    return false;
  }

  if (filters.status !== 'all') {
    if (filters.status === 'client_ready' && item.closeoutLabel !== 'Client-ready') {
      return false;
    }

    if (filters.status === 'closed' && item.closeoutLabel !== 'Closed') {
      return false;
    }

    if (filters.status === 'cancelled' && item.closeoutLabel !== 'Cancelled') {
      return false;
    }
  }

  if (filters.proof !== 'all') {
    if (filters.proof === 'missing' && item.proofStatus !== null) {
      return false;
    }

    if (filters.proof === 'approved' && item.proofStatus !== 'approved') {
      return false;
    }

    if (filters.proof === 'rejected' && item.proofStatus !== 'rejected') {
      return false;
    }
  }

  return true;
}

function buildHistoryFilterPills(items: DashboardHistoryItem[]) {
  return [
    { label: 'Archive items', value: String(items.length) },
    {
      label: 'Client-ready',
      value: String(items.filter((item) => item.closeoutLabel === 'Client-ready').length),
    },
    {
      label: 'Closed',
      value: String(items.filter((item) => item.closeoutLabel === 'Closed').length),
    },
    {
      label: 'Proof issues',
      value: String(items.filter((item) => item.proofStatus === 'rejected').length),
    },
  ];
}

function buildOperatorDispatchState(
  booking: Pick<BookingRow, 'client_ready_at' | 'closed_at' | 'status'>,
  run: Pick<RunRow, 'issue_note' | 'proof_required' | 'status'> | null,
  proofCount: number,
  latestProofStatus: ProofAssetRow['status'] | null
) {
  if (booking.closed_at) {
    return {
      dispatchStageLabel: 'Closed',
      dispatchStageTone: 'success' as const,
      nextAction: 'Campaign closeout is complete. Keep the recap link and proof log ready for future reference.',
      proofReviewLabel: proofCount > 0 ? `${formatPlural(proofCount, 'proof')} archived` : 'No proof uploaded',
      proofReviewTone: proofCount > 0 ? 'success' as const : 'warning' as const,
    };
  }

  if (booking.status === 'cancelled') {
    return {
      dispatchStageLabel: 'Cancelled',
      dispatchStageTone: 'warning' as const,
      nextAction: 'This campaign is cancelled. Re-open only if the planner confirms a replacement route.',
      proofReviewLabel: proofCount > 0 ? `${formatPlural(proofCount, 'proof')} archived` : 'No proof uploaded',
      proofReviewTone: proofCount > 0 ? 'success' as const : 'warning' as const,
    };
  }

  if (latestProofStatus === 'rejected') {
    return {
      dispatchStageLabel: 'Proof follow-up',
      dispatchStageTone: 'warning' as const,
      nextAction: 'Proof was rejected. Coordinate a reshoot or clearer upload with the driver before closeout.',
      proofReviewLabel: 'Proof rejected',
      proofReviewTone: 'warning' as const,
    };
  }

  if (latestProofStatus === 'approved') {
    return {
      dispatchStageLabel: booking.client_ready_at ? 'Client-ready' : 'Proof approved',
      dispatchStageTone: 'success' as const,
      nextAction: booking.client_ready_at
        ? 'Client-ready closeout is set. Share the public recap or mark the campaign closed once delivery is complete.'
        : 'Proof is approved. Mark the campaign client-ready, then share the final recap with the planner.',
      proofReviewLabel: `${formatPlural(proofCount, 'proof')} approved`,
      proofReviewTone: 'success' as const,
    };
  }

  if (latestProofStatus === 'uploaded') {
    return {
      dispatchStageLabel: 'Proof review',
      dispatchStageTone: 'warning' as const,
      nextAction: 'A proof upload is waiting on operator review. Approve it or send the driver back for another pass.',
      proofReviewLabel: `${formatPlural(proofCount, 'proof')} waiting`,
      proofReviewTone: 'warning' as const,
    };
  }

  if (!run || !run.status) {
    return {
      dispatchStageLabel: 'Dispatch pending',
      dispatchStageTone: 'warning' as const,
      nextAction: 'Assign a driver and lock the run window so the planner sees a concrete dispatch plan.',
      proofReviewLabel: run?.proof_required ? 'Proof required once live' : 'Proof optional',
      proofReviewTone: run?.proof_required ? 'warning' as const : 'success' as const,
    };
  }

  if (run.status === 'assigned') {
    return {
      dispatchStageLabel: 'Driver assigned',
      dispatchStageTone: 'success' as const,
      nextAction: 'Driver is assigned. Next milestone is moving the run en route at launch time.',
      proofReviewLabel: run.proof_required ? 'Proof required once live' : 'Proof optional',
      proofReviewTone: run.proof_required ? 'warning' as const : 'success' as const,
    };
  }

  if (run.status === 'en_route') {
    return {
      dispatchStageLabel: 'Rolling',
      dispatchStageTone: 'warning' as const,
      nextAction: 'The truck is on the move. Watch for the live confirmation and be ready to review proof later.',
      proofReviewLabel: run.proof_required ? 'Proof required after route' : 'Proof optional',
      proofReviewTone: run.proof_required ? 'warning' as const : 'success' as const,
    };
  }

  if (run.status === 'live') {
    return {
      dispatchStageLabel: 'Live now',
      dispatchStageTone: 'success' as const,
      nextAction: run.proof_required
        ? 'Campaign is live. Wait for the driver upload so review can happen immediately after the route.'
        : 'Campaign is live. Close the run when the route ends.',
      proofReviewLabel: run.proof_required ? 'Awaiting live proof' : 'Proof optional',
      proofReviewTone: run.proof_required ? 'warning' as const : 'success' as const,
    };
  }

  if (run.status === 'issue') {
    return {
      dispatchStageLabel: 'Issue',
      dispatchStageTone: 'warning' as const,
      nextAction: run.issue_note
        ? `Issue reported: ${run.issue_note}`
        : 'The route is blocked by an issue. Investigate the problem, update the plan, and move the run back to execution when ready.',
      proofReviewLabel: proofCount > 0 ? `${formatPlural(proofCount, 'proof')} logged` : 'No proof uploaded',
      proofReviewTone: proofCount > 0 ? 'success' as const : 'warning' as const,
    };
  }

  return {
    dispatchStageLabel: 'Closed',
    dispatchStageTone: 'success' as const,
    nextAction: 'Campaign execution is complete. Keep the proof ledger tidy and move to the next route.',
    proofReviewLabel: proofCount > 0 ? `${formatPlural(proofCount, 'proof')} logged` : 'No proof uploaded',
    proofReviewTone: proofCount > 0 ? 'success' as const : 'warning' as const,
  };
}

function buildProofReviewAction(status: ProofAssetRow['status'], canReview: boolean) {
  if (canReview) {
    return {
      nextAction: 'Open the asset, verify truck visibility, then approve or reject with a review note.',
      reviewTone: 'warning' as const,
    };
  }

  if (status === 'approved') {
    return {
      nextAction: 'Approved proof is ready for planner/client recap.',
      reviewTone: 'success' as const,
    };
  }

  return {
    nextAction: 'Rejected proof needs a clearer resubmission from the driver.',
    reviewTone: 'warning' as const,
  };
}

function buildDriverProofAction(
  latestProof: Pick<ProofAssetRow, 'review_notes' | 'status'> | null,
  proofRequired: boolean,
  run: Pick<RunRow, 'issue_note' | 'status'> | null
) {
  if (run?.status === 'issue') {
    return {
      proofActionCallout: run.issue_note
        ? `Route is paused on an issue: ${run.issue_note}`
        : 'Route is paused until the current issue is resolved.',
      proofActionTone: 'warning' as const,
    };
  }

  if (!latestProof) {
    return {
      proofActionCallout: proofRequired
        ? 'Upload proof before you attempt to complete this run.'
        : 'Upload proof if you want operator-ready evidence for this route.',
      proofActionTone: proofRequired ? 'warning' as const : 'success' as const,
    };
  }

  if (latestProof.status === 'rejected') {
    return {
      proofActionCallout: latestProof.review_notes
        ? `Proof rejected. ${latestProof.review_notes}`
        : 'Proof rejected. Upload another proof file before closing the loop.',
      proofActionTone: 'warning' as const,
    };
  }

  if (latestProof.status === 'uploaded') {
    return {
      proofActionCallout: 'Proof uploaded. Waiting for operator review.',
      proofActionTone: 'warning' as const,
    };
  }

  return {
    proofActionCallout: 'Proof approved. This route is ready for planner/client recap.',
    proofActionTone: 'success' as const,
  };
}

function buildPlannerExecutionLabels(
  booking: Pick<BookingRow, 'campaign_name' | 'client_ready_at' | 'closed_at' | 'status'> | null | undefined,
  run: Pick<RunRow, 'issue_note' | 'issue_reported_at' | 'issue_resolved_at' | 'proof_required' | 'scheduled_end_at' | 'scheduled_start_at' | 'status'> | null | undefined,
  proofs: Pick<ProofAssetRow, 'status'>[] = []
) {
  const latestProof = proofs[0] ?? null;
  const timeline = [
    booking ? `Booking ${formatStatus(booking.status)}` : 'Offer submitted',
  ];

  if (run) {
    timeline.push(`Run ${formatStatus(run.status)}`);
  }

  if (run?.issue_note) {
    timeline.push(run.issue_resolved_at ? 'Issue resolved' : 'Issue reported');
  }

  if (latestProof) {
    timeline.push(`Proof ${formatStatus(latestProof.status)}`);
  } else if (run?.proof_required) {
    timeline.push('Proof required');
  }

  let campaignStageLabel = 'Offer pending';
  let campaignStageTone: BadgeTone = 'warning';
  let nextAction = 'Wait for the operator to review this offer.';
  let issueUpdatedLabel: string | null = null;

  if (booking?.closed_at) {
    campaignStageLabel = 'Closed';
    campaignStageTone = 'success';
    nextAction = 'Campaign closeout is complete. Use the recap artifact for any later client follow-through.';
  } else if (booking?.status === 'cancelled') {
    campaignStageLabel = 'Cancelled';
    nextAction = 'This campaign was cancelled. Rebook or open a new route if the window changes.';
  } else if (run?.status === 'issue') {
    campaignStageLabel = 'Issue';
    nextAction = run.issue_note
      ? `Operator is resolving: ${run.issue_note}`
      : 'An execution issue is blocking the route. Watch for the revised dispatch plan.';
    issueUpdatedLabel = formatOptionalDateTime(run.issue_reported_at);
  } else if (latestProof?.status === 'rejected') {
    campaignStageLabel = 'Proof rejected';
    nextAction = 'The operator rejected the latest proof. Watch for the driver resubmission before closeout.';
  } else if (latestProof?.status === 'uploaded') {
    campaignStageLabel = 'Proof review';
    nextAction = 'The driver uploaded proof. Operator review is the next milestone.';
  } else if (latestProof?.status === 'approved') {
    campaignStageLabel = booking?.client_ready_at ? 'Client-ready' : 'Proof approved';
    campaignStageTone = 'success';
    nextAction = booking?.client_ready_at
      ? 'Campaign is client-ready. Share the recap or wait for final closeout.'
      : 'Proof is approved. The next closeout step is marking the campaign client-ready.';
  } else if (run?.status === 'live') {
    campaignStageLabel = 'Live';
    campaignStageTone = 'success';
    nextAction = 'The route is live. Watch for proof review and closeout.';
  } else if (run?.status === 'en_route') {
    campaignStageLabel = 'En route';
    nextAction = 'The truck is rolling to the active route.';
  } else if (run?.status === 'assigned') {
    campaignStageLabel = 'Scheduled';
    campaignStageTone = 'success';
    nextAction = 'Driver is assigned and the route is scheduled.';
  } else if (booking?.status === 'confirmed') {
    campaignStageLabel = 'Dispatch pending';
    nextAction = 'The offer is booked. Operator dispatch details are still being finalized.';
  } else if (booking?.status === 'completed') {
    campaignStageLabel = 'Closed';
    campaignStageTone = 'success';
    nextAction = 'The booking is complete.';
  }

  const executionLabel =
    run
      ? `${formatStatus(run.status)} • ${formatTimeWindow(run.scheduled_start_at, run.scheduled_end_at)}`
      : booking
        ? booking.status === 'confirmed'
          ? 'Dispatch pending'
          : `${formatStatus(booking.status)} • Awaiting run details`
        : null;

  const proofLabel =
    latestProof
      ? `${formatStatus(latestProof.status)} • ${formatPlural(proofs.length, 'proof')} logged`
      : run?.proof_required
        ? 'Proof required • Awaiting first upload'
        : run
          ? 'Proof optional'
          : null;

  const proofTone = latestProof
    ? getStatusTone(latestProof.status)
    : run?.proof_required
      ? 'warning'
      : run
        ? 'success'
        : null;

  return {
    campaignStageLabel,
    campaignStageTone,
    executionLabel,
    issueNote: run?.issue_note ?? null,
    issueUpdatedLabel,
    nextAction,
    proofLabel,
    proofTone,
    timeline,
  };
}

function buildSlotSummary(slot: Pick<SlotRow, 'end_at' | 'rate_cents' | 'region' | 'start_at'>) {
  return `${slot.region} • ${formatTimeWindow(slot.start_at, slot.end_at)} • ${formatCurrency(slot.rate_cents)}`;
}

async function getOrganization(organizationId: string | null) {
  const supabase = await createServerSupabaseClient();

  if (!supabase || !organizationId) {
    return null;
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, primary_region')
    .eq('id', organizationId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Pick<OrganizationRow, 'id' | 'name' | 'primary_region'>;
}

async function getOrganizationsMap(ids: string[]) {
  const supabase = await createServerSupabaseClient();

  if (!supabase || ids.length === 0) {
    return new Map<string, Pick<OrganizationRow, 'id' | 'name'>>();
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name')
    .in('id', ids);

  if (error || !data) {
    return new Map<string, Pick<OrganizationRow, 'id' | 'name'>>();
  }

  return new Map((data as Pick<OrganizationRow, 'id' | 'name'>[]).map((item) => [item.id, item]));
}

async function getProfilesMap(ids: string[]) {
  const supabase = await createServerSupabaseClient();

  if (!supabase || ids.length === 0) {
    return new Map<string, Pick<ProfileRow, 'full_name' | 'email' | 'id'>>();
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', ids);

  if (error || !data) {
    return new Map<string, Pick<ProfileRow, 'full_name' | 'email' | 'id'>>();
  }

  return new Map((data as Pick<ProfileRow, 'full_name' | 'email' | 'id'>[]).map((item) => [item.id, item]));
}

export async function getOperatorDashboardData(
  historyFilters: HistoryArchiveFilters = {
    proof: 'all',
    query: '',
    region: 'all',
    status: 'all',
  }
): Promise<OperatorDashboardData> {
  const fallback: OperatorDashboardData = {
    activeBookings: [],
    attentionQueue: [],
    badgeLabel: 'No active supply',
    badgeTone: 'warning',
    driverOptions: [],
    healthSummary: [
      { label: 'Live routes', value: '0' },
      { label: 'Needs action', value: '0' },
      { label: 'Dispatch next 6h', value: '0' },
      { label: 'Client-ready', value: '0' },
    ],
    historyFilterPills: [],
    historyFilters,
    incomingOffers: [],
    inventorySlots: [],
    kpis: [
      { label: 'Tracked slots', value: '0' },
      { label: 'Pending offers', value: '0' },
      { label: 'Active campaigns', value: '0' },
      { label: 'Proof reviews', value: '0' },
    ],
    proofReviews: [],
    recentHistory: [],
    sourceLabel: 'Authenticated operator view',
    title: 'Texas fleet, one control room.',
    truckOptions: [],
  };

  const profile = await requireAuthenticatedProfile('operator');
  const supabase = await createServerSupabaseClient();

  if (!profile.organization_id || !supabase) {
    return fallback;
  }

  const organization = await getOrganization(profile.organization_id);
  const [trucksResult, slotsResult, offersResult, bookingsResult, driversResult] = await Promise.all([
    supabase
      .from('trucks')
      .select('id, display_name, vehicle_code, home_region')
      .eq('operator_organization_id', profile.organization_id)
      .order('display_name'),
    supabase
      .from('slots')
      .select('id, truck_id, region, start_at, end_at, rate_cents, status, campaign_notes')
      .eq('operator_organization_id', profile.organization_id)
      .order('start_at'),
    supabase
      .from('offers')
      .select('id, slot_id, planner_organization_id, amount_cents, status, message, operator_note, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('bookings')
      .select('id, slot_id, planner_organization_id, status, campaign_name, internal_note, client_ready_at, closed_at')
      .eq('operator_organization_id', profile.organization_id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('organization_id', profile.organization_id)
      .eq('role', 'driver')
      .order('full_name'),
  ]);

  if (
    trucksResult.error ||
    slotsResult.error ||
    offersResult.error ||
    bookingsResult.error ||
    driversResult.error
  ) {
    return fallback;
  }

  const trucks = (trucksResult.data ?? []) as Pick<
    TruckRow,
    'display_name' | 'home_region' | 'id' | 'vehicle_code'
  >[];
  const slots = (slotsResult.data ?? []) as Pick<
    SlotRow,
    'campaign_notes' | 'end_at' | 'id' | 'rate_cents' | 'region' | 'start_at' | 'status' | 'truck_id'
  >[];
  const offers = (offersResult.data ?? []) as Pick<
    OfferRow,
    'amount_cents' | 'created_at' | 'id' | 'message' | 'operator_note' | 'planner_organization_id' | 'slot_id' | 'status'
  >[];
  const bookings = (bookingsResult.data ?? []) as Pick<
    BookingRow,
    'campaign_name' | 'client_ready_at' | 'closed_at' | 'id' | 'internal_note' | 'planner_organization_id' | 'slot_id' | 'status'
  >[];
  const organizationDrivers = (driversResult.data ?? []) as Pick<
    ProfileRow,
    'email' | 'full_name' | 'id'
  >[];

  const bookingIds = bookings.map((booking) => booking.id);
  const runsResult =
    bookingIds.length > 0
      ? await supabase
          .from('runs')
          .select('id, booking_id, driver_id, issue_note, issue_reported_at, issue_resolved_at, scheduled_start_at, scheduled_end_at, status, proof_required')
          .in('booking_id', bookingIds)
          .order('scheduled_start_at')
      : { data: [], error: null };

  if (runsResult.error) {
    return fallback;
  }

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
  const runIds = runs.map((run) => run.id);
  const proofAssetsResult =
    runIds.length > 0
      ? await supabase
          .from('proof_assets')
          .select('id, run_id, driver_id, storage_path, captured_at, created_at, status, review_notes, reviewed_at')
          .in('run_id', runIds)
          .order('created_at', { ascending: false })
      : { data: [], error: null };

  if (proofAssetsResult.error) {
    return fallback;
  }

  const proofAssets = (proofAssetsResult.data ?? []) as Pick<
    ProofAssetRow,
    'captured_at' | 'created_at' | 'driver_id' | 'id' | 'review_notes' | 'reviewed_at' | 'run_id' | 'status' | 'storage_path'
  >[];

  const plannerOrganizations = await getOrganizationsMap(
    Array.from(new Set(offers.map((offer) => offer.planner_organization_id).concat(bookings.map((booking) => booking.planner_organization_id))))
  );
  const drivers = await getProfilesMap(
    Array.from(new Set(runs.map((run) => run.driver_id).concat(proofAssets.map((asset) => asset.driver_id)).filter(Boolean))) as string[]
  );
  const truckMap = new Map(trucks.map((truck) => [truck.id, truck]));
  const slotMap = new Map(slots.map((slot) => [slot.id, slot]));
  const runByBookingId = new Map(runs.map((run) => [run.booking_id, run]));
  const proofsByRun = new Map<string, Pick<
    ProofAssetRow,
    'captured_at' | 'created_at' | 'driver_id' | 'id' | 'review_notes' | 'reviewed_at' | 'run_id' | 'status' | 'storage_path'
  >[]>();

  proofAssets.forEach((asset) => {
    const group = proofsByRun.get(asset.run_id) ?? [];
    group.push(asset);
    proofsByRun.set(asset.run_id, group);
  });

  const pendingOffers = offers.filter((offer) => offer.status === 'pending');
  const pendingProofReviews = proofAssets.filter((asset) => asset.status === 'uploaded');
  const activeBookingContexts = bookings.map((booking) => {
    const slot = slotMap.get(booking.slot_id);
    const truck = slot ? truckMap.get(slot.truck_id) : null;
    const run = runByBookingId.get(booking.id) ?? null;
    const proofs = run ? proofsByRun.get(run.id) ?? [] : [];
    const latestProof = proofs[0] ?? null;
    const assignedDriver = run?.driver_id ? drivers.get(run.driver_id) : null;
    const dispatchState = buildOperatorDispatchState(booking, run, proofs.length, latestProof?.status ?? null);

    return {
      assignedDriver,
      booking,
      dispatchState,
      latestProof,
      proofs,
      run,
      slot,
      truck,
    };
  });

  const activeBookings = activeBookingContexts.map((context) => ({
    bookingId: context.booking.id,
    bookingStatus: context.booking.status,
    campaignName: context.booking.campaign_name,
    dispatchStageLabel: context.dispatchState.dispatchStageLabel,
    dispatchStageTone: context.dispatchState.dispatchStageTone,
    dispatchEndAtInput: formatDateTimeInput(context.run?.scheduled_end_at ?? context.slot?.end_at ?? new Date().toISOString()),
    dispatchStartAtInput: formatDateTimeInput(context.run?.scheduled_start_at ?? context.slot?.start_at ?? new Date().toISOString()),
    driverId: context.run?.driver_id ?? '',
    driverLabel: context.assignedDriver?.full_name ?? context.assignedDriver?.email ?? 'No driver assigned',
    internalNote: context.booking.internal_note ?? '',
    issueNote: context.run?.issue_note ?? '',
    issueReportedAtLabel: formatOptionalDateTime(context.run?.issue_reported_at),
    issueResolvedAtLabel: formatOptionalDateTime(context.run?.issue_resolved_at),
    latestProofStatusLabel: context.latestProof ? formatStatus(context.latestProof.status) : 'No proof yet',
    nextAction: context.dispatchState.nextAction,
    plannerLabel:
      plannerOrganizations.get(context.booking.planner_organization_id)?.name ?? 'Planner organization',
    proofReviewLabel: context.dispatchState.proofReviewLabel,
    proofReviewTone: context.dispatchState.proofReviewTone,
    proofRequired: context.run?.proof_required ?? true,
    proofCountLabel: `${formatPlural(context.proofs.length, 'proof')} logged`,
    recapHref: getCampaignRecapHref(context.booking.id),
    runId: context.run?.id ?? null,
    runStatus: context.run?.status ?? null,
    scheduleLabel:
      context.run && context.slot
        ? `${buildSlotSummary(context.slot)} • ${formatStatus(context.run.status)}`
        : context.slot
          ? buildSlotSummary(context.slot)
          : 'Campaign schedule unavailable',
    slotTitle: context.truck ? `${context.truck.display_name} (${context.truck.vehicle_code})` : 'Truck inventory',
  }));

  const proofReviews = proofAssets.slice(0, 8).map((asset) => {
    const run = runs.find((entry) => entry.id === asset.run_id);
    const booking = run ? bookings.find((entry) => entry.id === run.booking_id) : null;
    const driver = drivers.get(asset.driver_id);
    const reviewAction = buildProofReviewAction(asset.status, asset.status === 'uploaded');
    return {
      assetUrl: getProofAssetHref(asset.id),
      canReview: asset.status === 'uploaded',
      driverLabel: driver?.full_name ?? driver?.email ?? 'Assigned driver',
      fileName: getFileName(asset.storage_path),
      id: asset.id,
      nextAction: reviewAction.nextAction,
      reviewNotes: asset.review_notes ?? '',
      reviewedAtLabel: asset.reviewed_at ? dateTimeFormatter.format(new Date(asset.reviewed_at)) : null,
      reviewTone: reviewAction.reviewTone,
      runTitle: booking?.campaign_name ?? 'Assigned campaign',
      statusLabel: formatStatus(asset.status),
      uploadedAtLabel: asset.captured_at
        ? dateTimeFormatter.format(new Date(asset.captured_at))
        : dateTimeFormatter.format(new Date(asset.created_at)),
    };
  });

  const healthSummary: DashboardKpi[] = [
    { label: 'Live routes', value: String(activeBookingContexts.filter((context) => context.run?.status === 'live').length) },
    {
      label: 'Needs action',
      value: String(
        activeBookingContexts.filter((context) => context.run?.status === 'issue').length +
          pendingProofReviews.length
      ),
    },
    {
      label: 'Dispatch next 6h',
      value: String(
        activeBookingContexts.filter(
          (context) =>
            context.slot &&
            (!context.run || context.run.status === 'assigned') &&
            isWithinHours(context.run?.scheduled_start_at ?? context.slot.start_at, 6)
        ).length
      ),
    },
    {
      label: 'Client-ready',
      value: String(
        activeBookingContexts.filter(
          (context) => Boolean(context.booking.client_ready_at) && !Boolean(context.booking.closed_at)
        ).length
      ),
    },
  ];

  const attentionQueue: DashboardAttentionItem[] = [
    ...activeBookingContexts
      .filter((context) => context.run?.status === 'issue')
      .map((context) => ({
        actionLabel: 'Resolve issue',
        detail: context.run?.issue_note ?? 'Execution is blocked until the route is reset.',
        id: `operator-booking-issue-${context.booking.id}`,
        title: context.booking.campaign_name,
        tone: 'warning' as const,
      })),
    ...proofAssets
      .filter((asset) => asset.status === 'uploaded')
      .slice(0, 4)
      .map((asset) => {
        const run = runs.find((entry) => entry.id === asset.run_id);
        const booking = run ? bookings.find((entry) => entry.id === run.booking_id) : null;

        return {
          actionLabel: 'Review proof',
          detail: `${getFileName(asset.storage_path)} is waiting for operator review.`,
          id: `operator-proof-${asset.id}`,
          title: booking?.campaign_name ?? 'Assigned campaign',
          tone: 'warning' as const,
        };
      }),
    ...activeBookingContexts
      .filter(
        (context) =>
          context.slot &&
          (!context.run || context.run.status === 'assigned') &&
          isPastDue(context.run?.scheduled_start_at ?? context.slot.start_at)
      )
      .map((context) => ({
        actionLabel: 'Update dispatch',
        detail: 'The launch window has started and the run is not yet moving.',
        id: `operator-booking-dispatch-${context.booking.id}`,
        title: context.booking.campaign_name,
        tone: 'warning' as const,
      })),
    ...proofAssets
      .filter((asset) => asset.status === 'rejected')
      .slice(0, 2)
      .map((asset) => {
        const run = runs.find((entry) => entry.id === asset.run_id);
        const booking = run ? bookings.find((entry) => entry.id === run.booking_id) : null;

        return {
          actionLabel: 'Coordinate reshoot',
          detail: asset.review_notes ?? 'The latest proof was rejected and needs a cleaner replacement.',
          id: `operator-proof-rejected-${asset.id}`,
          title: booking?.campaign_name ?? 'Assigned campaign',
          tone: 'warning' as const,
        };
      }),
  ].slice(0, 6);

  const recentHistory: DashboardHistoryItem[] = activeBookingContexts
    .filter(
      (context) =>
        Boolean(context.booking.closed_at) ||
        Boolean(context.booking.client_ready_at) ||
        context.booking.status === 'cancelled' ||
        context.latestProof?.status === 'rejected'
    )
    .map((context) => {
      const closeoutLabel = getHistoryCloseoutLabel(context.booking);

      return {
        closeoutLabel,
        dateLabel:
          formatOptionalDateTime(context.booking.closed_at ?? context.booking.client_ready_at ?? context.run?.scheduled_end_at) ??
          'Recently',
        detail: context.run
          ? `${formatStatus(context.run.status)} • ${formatTimeWindow(context.run.scheduled_start_at, context.run.scheduled_end_at)}`
          : context.slot
            ? buildSlotSummary(context.slot)
            : 'Campaign schedule unavailable',
        id: `operator-history-${context.booking.id}`,
        proofLabel: context.latestProof ? formatStatus(context.latestProof.status) : null,
        proofStatus: context.latestProof?.status ?? null,
        recapHref: getCampaignRecapHref(context.booking.id),
        region: context.slot?.region ?? null,
        statusLabel: formatStatus(context.booking.status),
        title: context.booking.campaign_name,
        tone:
          closeoutLabel === 'Closed' ||
          closeoutLabel === 'Client-ready' ||
          context.latestProof?.status === 'approved'
            ? ('success' as const)
            : ('warning' as const),
      };
    })
    .filter((item) => matchesHistoryFilters(item, historyFilters))
    .slice(0, 6);

  return {
    activeBookings,
    attentionQueue,
    badgeLabel: pendingOffers.length > 0 ? `${formatPlural(pendingOffers.length, 'offer')} waiting` : `${formatPlural(slots.length, 'tracked slot')}`,
    badgeTone: slots.length > 0 ? 'success' : 'warning',
    driverOptions: organizationDrivers.map((driver) => ({
      id: driver.id,
      label: driver.full_name ?? driver.email,
    })),
    healthSummary,
    historyFilterPills: buildHistoryFilterPills(recentHistory),
    historyFilters,
    incomingOffers: offers.slice(0, 8).map((offer) => {
      const slot = slotMap.get(offer.slot_id);
      const truck = slot ? truckMap.get(slot.truck_id) : null;
      return {
        amountLabel: formatCurrency(offer.amount_cents),
        canAccept: offer.status === 'pending',
        canReject: offer.status === 'pending',
        createdLabel: dateTimeFormatter.format(new Date(offer.created_at)),
        id: offer.id,
        message: offer.message,
        operatorNote: offer.operator_note,
        plannerLabel:
          plannerOrganizations.get(offer.planner_organization_id)?.name ?? 'Planner organization',
        slotDetail: slot ? buildSlotSummary(slot) : 'Slot summary unavailable',
        slotTitle: truck ? `${truck.display_name} (${truck.vehicle_code})` : 'Truck inventory',
        statusLabel: formatStatus(offer.status),
      };
    }),
    inventorySlots: slots.map((slot) => {
      const truck = truckMap.get(slot.truck_id);
      return {
        campaignNotes: slot.campaign_notes ?? '',
        id: slot.id,
        rateDollars: (slot.rate_cents / 100).toFixed(0),
        region: slot.region,
        startAtInput: formatDateTimeInput(slot.start_at),
        status: slot.status,
        summary: buildSlotSummary(slot),
        truckId: slot.truck_id,
        truckLabel: truck ? `${truck.display_name} (${truck.vehicle_code})` : 'Assigned truck',
        endAtInput: formatDateTimeInput(slot.end_at),
      };
    }),
    kpis: [
      { label: 'Tracked slots', value: String(slots.length) },
      { label: 'Pending offers', value: String(pendingOffers.length) },
      { label: 'Active campaigns', value: String(bookings.length) },
      { label: 'Proof reviews', value: String(pendingProofReviews.length) },
    ],
    proofReviews,
    recentHistory,
    sourceLabel: organization?.name
      ? `Authenticated operator view for ${organization.name}`
      : 'Authenticated operator view',
    title: 'Texas fleet, one control room.',
    truckOptions: trucks.map((truck) => ({
      homeRegion: truck.home_region,
      id: truck.id,
      label: `${truck.display_name} (${truck.vehicle_code})`,
    })),
  };
}

export async function getPlannerMarketplaceData(
  filters: PlannerMarketplaceFilters,
  historyFilters: HistoryArchiveFilters = {
    proof: 'all',
    query: '',
    region: 'all',
    status: 'all',
  }
): Promise<PlannerMarketplaceData> {
  const fallback: PlannerMarketplaceData = {
    attentionQueue: [],
    availableSlots: [],
    badgeLabel: '0 slots visible',
    filterPills: [],
    filterState: filters,
    healthSummary: [
      { label: 'At risk', value: '0' },
      { label: 'Live now', value: '0' },
      { label: 'Awaiting proof', value: '0' },
      { label: 'Client-ready', value: '0' },
    ],
    historyFilterPills: [],
    historyFilters,
    regions: ['DFW'],
    recentHistory: [],
    sourceLabel: 'Authenticated planner view',
    submittedOffers: [],
    trackerSummary: [
      { label: 'Tracked campaigns', value: '0' },
      { label: 'Issues', value: '0' },
      { label: 'Live routes', value: '0' },
      { label: 'Proof review', value: '0' },
    ],
    title: 'Search mobile inventory fast.',
  };

  const profile = await requireAuthenticatedProfile('planner');
  const supabase = await createServerSupabaseClient();

  if (!profile.organization_id || !supabase) {
    return fallback;
  }

  const organization = await getOrganization(profile.organization_id);
  const [slotsResult, trucksResult, offersResult, bookingsResult, runsResult, proofAssetsResult] = await Promise.all([
    supabase
      .from('slots')
      .select('id, truck_id, region, start_at, end_at, rate_cents, status, campaign_notes')
      .in('status', ['available', 'offered', 'booked'])
      .order('start_at'),
    supabase.from('trucks').select('id, display_name, vehicle_code').order('display_name'),
    supabase
      .from('offers')
      .select('id, slot_id, amount_cents, status, message, operator_note, created_at, updated_at')
      .eq('planner_organization_id', profile.organization_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('bookings')
      .select('id, offer_id, slot_id, status, campaign_name, internal_note, client_ready_at, closed_at')
      .eq('planner_organization_id', profile.organization_id),
    supabase
      .from('runs')
      .select('id, booking_id, issue_note, issue_reported_at, issue_resolved_at, scheduled_start_at, scheduled_end_at, status, proof_required')
      .order('scheduled_start_at'),
    supabase
      .from('proof_assets')
      .select('id, run_id, status, review_notes, created_at')
      .order('created_at', { ascending: false }),
  ]);

  if (
    slotsResult.error ||
    trucksResult.error ||
    offersResult.error ||
    bookingsResult.error ||
    runsResult.error ||
    proofAssetsResult.error
  ) {
    return fallback;
  }

  const slots = (slotsResult.data ?? []) as Pick<
    SlotRow,
    'campaign_notes' | 'end_at' | 'id' | 'rate_cents' | 'region' | 'start_at' | 'status' | 'truck_id'
  >[];
  const trucks = (trucksResult.data ?? []) as Pick<TruckRow, 'display_name' | 'id' | 'vehicle_code'>[];
  const offers = (offersResult.data ?? []) as Pick<
    OfferRow,
    'amount_cents' | 'created_at' | 'id' | 'message' | 'operator_note' | 'slot_id' | 'status' | 'updated_at'
  >[];
  const bookings = (bookingsResult.data ?? []) as Pick<
    BookingRow,
    'campaign_name' | 'client_ready_at' | 'closed_at' | 'id' | 'internal_note' | 'offer_id' | 'slot_id' | 'status'
  >[];
  const runs = (runsResult.data ?? []) as Pick<
    RunRow,
    | 'booking_id'
    | 'id'
    | 'issue_note'
    | 'issue_reported_at'
    | 'issue_resolved_at'
    | 'proof_required'
    | 'scheduled_end_at'
    | 'scheduled_start_at'
    | 'status'
  >[];
  const proofAssets = (proofAssetsResult.data ?? []) as Pick<
    ProofAssetRow,
    'created_at' | 'id' | 'review_notes' | 'run_id' | 'status'
  >[];

  const truckMap = new Map(trucks.map((truck) => [truck.id, truck]));
  const latestOfferBySlot = new Map<string, Pick<
    OfferRow,
    'amount_cents' | 'created_at' | 'id' | 'message' | 'operator_note' | 'slot_id' | 'status' | 'updated_at'
  >>();

  offers.forEach((offer) => {
    if (!latestOfferBySlot.has(offer.slot_id)) {
      latestOfferBySlot.set(offer.slot_id, offer);
    }
  });

  const bookingByOfferId = new Map(
    bookings.filter((booking) => booking.offer_id).map((booking) => [booking.offer_id as string, booking])
  );
  const bookingBySlotId = new Map(bookings.map((booking) => [booking.slot_id, booking]));
  const trackedBookingIds = new Set(bookings.map((booking) => booking.id));
  const trackedRuns = runs.filter((run) => trackedBookingIds.has(run.booking_id));
  const trackedRunIds = new Set(trackedRuns.map((run) => run.id));
  const trackedProofAssets = proofAssets.filter((asset) => trackedRunIds.has(asset.run_id));
  const runByBookingId = new Map(trackedRuns.map((run) => [run.booking_id, run]));
  const proofsByRunId = new Map<string, Pick<ProofAssetRow, 'created_at' | 'id' | 'review_notes' | 'run_id' | 'status'>[]>();

  trackedProofAssets.forEach((proof) => {
    const group = proofsByRunId.get(proof.run_id) ?? [];
    group.push(proof);
    proofsByRunId.set(proof.run_id, group);
  });

  const regions = Array.from(new Set(slots.map((slot) => slot.region)));
  const query = filters.query.trim().toLowerCase();

  const filteredSlots = slots
    .filter((slot) => {
      const truck = truckMap.get(slot.truck_id);
      const searchableText = [
        slot.region,
        slot.campaign_notes ?? '',
        truck?.display_name ?? '',
        truck?.vehicle_code ?? '',
      ]
        .join(' ')
        .toLowerCase();

      if (query && !searchableText.includes(query)) {
        return false;
      }

      if (filters.region !== 'all' && slot.region !== filters.region) {
        return false;
      }

      if (filters.availability === 'open' && slot.status === 'booked') {
        return false;
      }

      if (filters.availability === 'booked' && slot.status !== 'booked') {
        return false;
      }

      return true;
    })
    .sort((left, right) => {
      if (filters.sort === 'price_high') {
        return right.rate_cents - left.rate_cents;
      }

      if (filters.sort === 'price_low') {
        return left.rate_cents - right.rate_cents;
      }

      return new Date(left.start_at).getTime() - new Date(right.start_at).getTime();
    });

  const filterPills: PlannerFilterPill[] = [
    { label: 'Visible slots', value: String(filteredSlots.length) },
    { label: 'Open inventory', value: String(filteredSlots.filter((slot) => slot.status !== 'booked').length) },
    { label: 'Booked', value: String(filteredSlots.filter((slot) => slot.status === 'booked').length) },
    { label: 'My active offers', value: String(offers.filter((offer) => offer.status === 'pending').length) },
  ];

  const submittedOfferContexts = offers.map((offer) => {
    const booking = bookingByOfferId.get(offer.id);
    const slot = slots.find((entry) => entry.id === offer.slot_id);
    const truck = slot ? truckMap.get(slot.truck_id) : null;
    const run = booking ? runByBookingId.get(booking.id) : null;
    const proofs = run ? proofsByRunId.get(run.id) ?? [] : [];
    const execution = buildPlannerExecutionLabels(booking, run, proofs);

    return {
      booking,
      execution,
      offer,
      proofs,
      run,
      slot,
      truck,
    };
  });

  const healthSummary: DashboardKpi[] = [
    {
      label: 'At risk',
      value: String(
        submittedOfferContexts.filter(
          (context) =>
            context.execution.campaignStageLabel === 'Issue' ||
            context.execution.campaignStageLabel === 'Proof rejected' ||
            context.execution.campaignStageLabel === 'Dispatch pending'
        ).length
      ),
    },
    {
      label: 'Live now',
      value: String(submittedOfferContexts.filter((context) => context.execution.campaignStageLabel === 'Live').length),
    },
    {
      label: 'Awaiting proof',
      value: String(
        submittedOfferContexts.filter(
          (context) =>
            context.execution.campaignStageLabel === 'Proof review' ||
            (context.run?.proof_required && ['assigned', 'en_route', 'live'].includes(context.run.status))
        ).length
      ),
    },
    {
      label: 'Client-ready',
      value: String(
        submittedOfferContexts.filter(
          (context) => context.execution.campaignStageLabel === 'Client-ready'
        ).length
      ),
    },
  ];

  const attentionQueue: DashboardAttentionItem[] = [
    ...submittedOfferContexts
      .filter((context) => context.execution.campaignStageLabel === 'Issue')
      .map((context) => ({
        actionLabel: 'Watch operator recovery',
        detail: context.execution.issueNote ?? 'Execution issue is blocking the route.',
        id: `planner-issue-${context.offer.id}`,
        title: context.booking?.campaign_name ?? context.truck?.display_name ?? 'Tracked campaign',
        tone: 'warning' as const,
      })),
    ...submittedOfferContexts
      .filter((context) => context.execution.campaignStageLabel === 'Proof review')
      .map((context) => ({
        actionLabel: 'Wait for approval',
        detail: 'The latest proof upload is waiting on operator review.',
        id: `planner-proof-review-${context.offer.id}`,
        title: context.booking?.campaign_name ?? context.truck?.display_name ?? 'Tracked campaign',
        tone: 'warning' as const,
      })),
    ...submittedOfferContexts
      .filter((context) => context.execution.campaignStageLabel === 'Dispatch pending')
      .map((context) => ({
        actionLabel: 'Expect dispatch plan',
        detail: 'The offer is booked, but operator dispatch details are still pending.',
        id: `planner-dispatch-${context.offer.id}`,
        title: context.booking?.campaign_name ?? context.truck?.display_name ?? 'Tracked campaign',
        tone: 'warning' as const,
      })),
    ...submittedOfferContexts
      .filter((context) => context.offer.status === 'pending')
      .map((context) => ({
        actionLabel: 'Wait for response',
        detail: `Offer updated ${dateTimeFormatter.format(new Date(context.offer.updated_at))}.`,
        id: `planner-offer-${context.offer.id}`,
        title: context.truck ? `${context.truck.display_name} (${context.truck.vehicle_code})` : 'Submitted offer',
        tone: 'warning' as const,
      })),
  ].slice(0, 6);

  const submittedOffers = submittedOfferContexts.map((context) => ({
    amountLabel: formatCurrency(context.offer.amount_cents),
    bookingLabel: context.booking ? `${formatStatus(context.booking.status)} • ${context.booking.campaign_name}` : null,
    campaignStageLabel: context.execution.campaignStageLabel,
    campaignStageTone: context.execution.campaignStageTone,
    executionLabel: context.execution.executionLabel,
    id: context.offer.id,
    issueNote: context.execution.issueNote,
    issueUpdatedLabel: context.execution.issueUpdatedLabel,
    message: context.offer.message,
    nextAction: context.execution.nextAction,
    operatorNote: context.offer.operator_note ?? context.booking?.internal_note ?? null,
    proofLabel: context.execution.proofLabel,
    proofTone: context.execution.proofTone,
    recapHref: context.booking ? getCampaignRecapHref(context.booking.id) : null,
    slotTitle: context.truck ? `${context.truck.display_name} (${context.truck.vehicle_code})` : 'Truck inventory',
    statusLabel: formatStatus(context.offer.status),
    statusTone: getStatusTone(context.offer.status),
    timeline: context.execution.timeline,
    updatedLabel: dateTimeFormatter.format(new Date(context.offer.updated_at)),
  }));

  const recentHistory: DashboardHistoryItem[] = submittedOfferContexts
    .filter(
      (
        context,
      ): context is (typeof submittedOfferContexts)[number] & {
        booking: NonNullable<(typeof submittedOfferContexts)[number]['booking']>;
      } => {
        const booking = context.booking;

        if (!booking) {
          return false;
        }

        return (
          Boolean(booking.client_ready_at) ||
          Boolean(booking.closed_at) ||
          booking.status === 'cancelled' ||
          context.execution.campaignStageLabel === 'Proof rejected'
        );
      }
    )
    .map((context) => ({
      closeoutLabel: getHistoryCloseoutLabel(context.booking),
      dateLabel:
        formatOptionalDateTime(context.booking.closed_at ?? context.booking.client_ready_at ?? context.run?.scheduled_end_at) ??
        'Recently',
      detail: context.execution.executionLabel ?? context.execution.nextAction,
      id: `planner-history-${context.offer.id}`,
      proofLabel: context.execution.proofLabel,
      proofStatus: context.proofs[0]?.status ?? null,
      recapHref: getCampaignRecapHref(context.booking.id),
      region: context.slot?.region ?? null,
      statusLabel: context.execution.campaignStageLabel,
      title: context.booking.campaign_name,
      tone: context.execution.campaignStageTone,
    }))
    .filter((item) => matchesHistoryFilters(item, historyFilters))
    .slice(0, 6);

  return {
    availableSlots: filteredSlots.map((slot) => {
      const truck = truckMap.get(slot.truck_id);
      const existingOffer = latestOfferBySlot.get(slot.id);
      const booking = existingOffer ? bookingByOfferId.get(existingOffer.id) : bookingBySlotId.get(slot.id);
      const run = booking ? runByBookingId.get(booking.id) : null;
      const proofs = run ? proofsByRunId.get(run.id) ?? [] : [];
      const execution = buildPlannerExecutionLabels(booking, run, proofs);
      const isActionLocked =
        slot.status === 'booked' ||
        (existingOffer ? ['accepted', 'pending'].includes(existingOffer.status) : false);

      return {
        bookingLabel: booking ? `${formatStatus(booking.status)} • ${booking.campaign_name}` : null,
        detail: buildSlotSummary(slot),
        executionLabel: execution.executionLabel,
        id: slot.id,
        isActionLocked,
        message: slot.campaign_notes,
        operatorNote: existingOffer?.operator_note ?? booking?.internal_note ?? null,
        proofLabel: execution.proofLabel,
        proofTone: execution.proofTone,
        rateDollars: (slot.rate_cents / 100).toFixed(0),
        status: slot.status,
        statusLabel: formatStatus(slot.status),
        statusTone: getStatusTone(slot.status),
        submittedOfferStatus: existingOffer ? formatStatus(existingOffer.status) : null,
        title: truck ? `${truck.display_name} (${truck.vehicle_code})` : 'Truck inventory',
      };
    }),
    attentionQueue,
    badgeLabel: `${formatPlural(filteredSlots.length, 'slot')} visible`,
    filterPills,
    filterState: filters,
    healthSummary,
    historyFilterPills: buildHistoryFilterPills(recentHistory),
    historyFilters,
    recentHistory,
    regions: regions.length > 0 ? regions : fallback.regions,
    sourceLabel: organization?.name
      ? `Authenticated planner view for ${organization.name}`
      : 'Authenticated planner view',
    trackerSummary: [
      { label: 'Tracked campaigns', value: String(bookings.length) },
      { label: 'Issues', value: String(trackedRuns.filter((run) => run.status === 'issue').length) },
      { label: 'Live routes', value: String(trackedRuns.filter((run) => run.status === 'live').length) },
      { label: 'Proof review', value: String(trackedProofAssets.filter((asset) => asset.status === 'uploaded').length) },
    ],
    submittedOffers,
    title: 'Search mobile inventory fast.',
  };
}

export async function getDriverWorkspaceData(
  historyFilters: HistoryArchiveFilters = {
    proof: 'all',
    query: '',
    region: 'all',
    status: 'all',
  }
): Promise<DriverWorkspaceData> {
  const fallback: DriverWorkspaceData = {
    attentionQueue: [],
    assignedRuns: [],
    badgeLabel: 'Proof upload pending',
    badgeTone: 'warning',
    historyFilterPills: [],
    historyFilters,
    proofCallout: 'Supabase proof storage is wired, but no assigned run data is currently available.',
    proofUploads: [],
    recentHistory: [],
    shiftSummary: [
      { label: 'Live now', value: '0' },
      { label: 'Blocked', value: '0' },
      { label: 'Need proof', value: '0' },
      { label: 'Approved', value: '0' },
    ],
    sourceLabel: 'Authenticated driver view',
    title: 'Execute runs without call-chain chaos.',
  };

  const profile = await requireAuthenticatedProfile('driver');
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return fallback;
  }

  const [runsResult, bookingsResult, proofAssetsResult] = await Promise.all([
    supabase
      .from('runs')
      .select('id, booking_id, issue_note, issue_reported_at, issue_resolved_at, scheduled_start_at, scheduled_end_at, status, proof_required')
      .eq('driver_id', profile.id)
      .order('scheduled_start_at'),
    supabase.from('bookings').select('id, campaign_name, status, internal_note, client_ready_at, closed_at, slot_id'),
    supabase
      .from('proof_assets')
      .select('id, run_id, storage_path, captured_at, created_at, status, review_notes, reviewed_at')
      .eq('driver_id', profile.id)
      .order('created_at', { ascending: false }),
  ]);

  if (runsResult.error || bookingsResult.error || proofAssetsResult.error) {
    return fallback;
  }

  const runs = (runsResult.data ?? []) as Pick<
    RunRow,
    | 'booking_id'
    | 'id'
    | 'issue_note'
    | 'issue_reported_at'
    | 'issue_resolved_at'
    | 'proof_required'
    | 'scheduled_end_at'
    | 'scheduled_start_at'
    | 'status'
  >[];
  const bookings = (bookingsResult.data ?? []) as Pick<
    BookingRow,
    'campaign_name' | 'client_ready_at' | 'closed_at' | 'id' | 'internal_note' | 'slot_id' | 'status'
  >[];
  const proofAssets = (proofAssetsResult.data ?? []) as Pick<
    ProofAssetRow,
    'captured_at' | 'created_at' | 'id' | 'review_notes' | 'reviewed_at' | 'run_id' | 'status' | 'storage_path'
  >[];

  const slotIds = Array.from(new Set(bookings.map((booking) => booking.slot_id)));
  const slotsResult =
    slotIds.length > 0
      ? await supabase
          .from('slots')
          .select('id, region')
          .in('id', slotIds)
      : { data: [], error: null };

  if (slotsResult.error) {
    return fallback;
  }

  const slots = (slotsResult.data ?? []) as Pick<SlotRow, 'id' | 'region'>[];
  const slotMap = new Map(slots.map((slot) => [slot.id, slot]));
  const bookingMap = new Map(bookings.map((booking) => [booking.id, booking]));
  const proofsByRun = new Map<string, Pick<
    ProofAssetRow,
    'captured_at' | 'created_at' | 'id' | 'review_notes' | 'reviewed_at' | 'run_id' | 'status' | 'storage_path'
  >[]>();

  proofAssets.forEach((asset) => {
    const group = proofsByRun.get(asset.run_id) ?? [];
    group.push(asset);
    proofsByRun.set(asset.run_id, group);
  });
  const approvedProofs = proofAssets.filter((asset) => asset.status === 'approved');
  const runContexts = runs.map((run) => {
    const booking = bookingMap.get(run.booking_id);
    const proofs = proofsByRun.get(run.id) ?? [];
    const latestProof = proofs[0] ?? null;
    const proofAction = buildDriverProofAction(latestProof, run.proof_required, run);

    return {
      booking,
      latestProof,
      proofAction,
      proofs,
      run,
    };
  });

  const shiftSummary: DashboardKpi[] = [
    { label: 'Live now', value: String(runContexts.filter((context) => context.run.status === 'live').length) },
    { label: 'Blocked', value: String(runContexts.filter((context) => context.run.status === 'issue').length) },
    {
      label: 'Need proof',
      value: String(
        runContexts.filter(
          (context) => context.run.status === 'live' && context.run.proof_required && context.proofs.length === 0
        ).length
      ),
    },
    { label: 'Approved', value: String(approvedProofs.length) },
  ];

  const attentionQueue: DashboardAttentionItem[] = [
    ...runContexts
      .filter((context) => context.run.status === 'issue')
      .map((context) => ({
        actionLabel: 'Wait for operator reset',
        detail: context.run.issue_note ?? 'This route is paused until the issue is resolved.',
        id: `driver-issue-${context.run.id}`,
        title: context.booking?.campaign_name ?? 'Assigned campaign',
        tone: 'warning' as const,
      })),
    ...runContexts
      .filter((context) => context.run.status === 'live' && context.run.proof_required && context.proofs.length === 0)
      .map((context) => ({
        actionLabel: 'Upload proof',
        detail: 'This route cannot be completed until at least one proof file is uploaded.',
        id: `driver-proof-needed-${context.run.id}`,
        title: context.booking?.campaign_name ?? 'Assigned campaign',
        tone: 'warning' as const,
      })),
    ...runContexts
      .filter((context) => context.latestProof?.status === 'rejected')
      .map((context) => ({
        actionLabel: 'Reshoot proof',
        detail: context.latestProof?.review_notes ?? 'The operator requested a cleaner upload.',
        id: `driver-proof-rejected-${context.run.id}`,
        title: context.booking?.campaign_name ?? 'Assigned campaign',
        tone: 'warning' as const,
      })),
    ...runContexts
      .filter((context) => context.run.status === 'assigned' && isWithinHours(context.run.scheduled_start_at, 2))
      .map((context) => ({
        actionLabel: 'Go en route',
        detail: `Launch window opens ${formatOptionalDateTime(context.run.scheduled_start_at) ?? 'soon'}.`,
        id: `driver-assigned-${context.run.id}`,
        title: context.booking?.campaign_name ?? 'Assigned campaign',
        tone: 'success' as const,
      })),
  ].slice(0, 6);

  const recentHistory: DashboardHistoryItem[] = runContexts
    .filter(
      (context) =>
        context.run.status === 'completed' ||
        context.latestProof?.status === 'approved' ||
        context.latestProof?.status === 'rejected'
    )
    .map((context) => {
      const booking = context.booking;
      const closeoutLabel = booking ? getHistoryCloseoutLabel(booking) : 'Completed';

      return {
        closeoutLabel,
        dateLabel:
          formatOptionalDateTime(booking?.closed_at ?? booking?.client_ready_at ?? context.run.scheduled_end_at) ??
          'Recently',
        detail: `${formatTimeWindow(context.run.scheduled_start_at, context.run.scheduled_end_at)} • ${context.proofAction.proofActionCallout}`,
        id: `driver-history-${context.run.id}`,
        proofLabel: context.latestProof ? formatStatus(context.latestProof.status) : null,
        proofStatus: context.latestProof?.status ?? null,
        recapHref: getCampaignRecapHref(context.run.booking_id),
        region: booking ? slotMap.get(booking.slot_id)?.region ?? null : null,
        statusLabel: formatStatus(context.run.status),
        title: context.booking?.campaign_name ?? 'Assigned campaign',
        tone:
          context.latestProof?.status === 'approved' ||
          closeoutLabel === 'Closed' ||
          closeoutLabel === 'Client-ready' ||
          context.run.status === 'completed'
            ? ('success' as const)
            : ('warning' as const),
      };
    })
    .filter((item) => matchesHistoryFilters(item, historyFilters))
    .slice(0, 6);

  return {
    attentionQueue,
    assignedRuns: runContexts.map((context) => ({
      bookingStatusLabel: context.booking ? formatStatus(context.booking.status) : 'Booking pending',
      detail: `${formatTimeWindow(context.run.scheduled_start_at, context.run.scheduled_end_at)} • ${formatStatus(context.run.status)}`,
      id: context.run.id,
      issueNote: context.run.issue_note,
      issueReportedAtLabel: formatOptionalDateTime(context.run.issue_reported_at),
      issueResolvedAtLabel: formatOptionalDateTime(context.run.issue_resolved_at),
      latestProofReviewNotes: context.latestProof?.review_notes ?? context.booking?.internal_note ?? null,
      latestProofStatusLabel: context.latestProof ? formatStatus(context.latestProof.status) : 'Awaiting first upload',
      proofActionCallout: context.proofAction.proofActionCallout,
      proofActionTone: context.proofAction.proofActionTone,
      proofCount: context.proofs.length,
      proofCountLabel: `${formatPlural(context.proofs.length, 'proof')} logged`,
      proofRequired: context.run.proof_required,
      recapHref: getCampaignRecapHref(context.run.booking_id),
      runStatus: context.run.status,
      statusLabel: formatStatus(context.run.status),
      title: context.booking?.campaign_name ?? 'Assigned campaign',
    })),
    badgeLabel:
      approvedProofs.length > 0
        ? `${formatPlural(approvedProofs.length, 'proof')} approved`
        : 'Proof review pending',
    badgeTone: approvedProofs.length > 0 ? 'success' : 'warning',
    historyFilterPills: buildHistoryFilterPills(recentHistory),
    historyFilters,
    proofCallout:
      proofAssets.length > 0
        ? `${formatPlural(proofAssets.length, 'proof file')} in review across your assigned runs.`
        : 'No proof assets have been uploaded yet for the seeded driver assignment.',
    proofUploads: proofAssets.map((asset) => {
      const run = runs.find((entry) => entry.id === asset.run_id);
      const booking = run ? bookingMap.get(run.booking_id) : null;
      return {
        assetUrl: getProofAssetHref(asset.id),
        capturedAtLabel: asset.captured_at
          ? dateTimeFormatter.format(new Date(asset.captured_at))
          : dateTimeFormatter.format(new Date(asset.created_at)),
        fileName: getFileName(asset.storage_path),
        id: asset.id,
        nextAction:
          asset.status === 'approved'
            ? 'Approved proof is ready for planner share.'
            : asset.status === 'rejected'
              ? 'Upload another proof file with the requested correction.'
              : 'Waiting for operator review.',
        reviewNotes: asset.review_notes,
        reviewedAtLabel: asset.reviewed_at ? dateTimeFormatter.format(new Date(asset.reviewed_at)) : null,
        runTitle: booking?.campaign_name ?? 'Assigned campaign',
        statusLabel: formatStatus(asset.status),
        tone: getStatusTone(asset.status),
      };
    }),
    recentHistory,
    shiftSummary,
    sourceLabel: `Authenticated driver view for ${profile.full_name ?? profile.email}`,
    title: 'Execute runs without call-chain chaos.',
  };
}
