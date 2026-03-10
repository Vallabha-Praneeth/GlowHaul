import type { Database } from '../../../packages/supabase/types/database';
import { requireAuthenticatedProfile } from './auth';
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
  dispatchEndAtInput: string;
  dispatchStartAtInput: string;
  driverId: string;
  driverLabel: string;
  internalNote: string;
  latestProofStatusLabel: string;
  plannerLabel: string;
  proofRequired: boolean;
  proofCountLabel: string;
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
  canReview: boolean;
  driverLabel: string;
  fileName: string;
  id: string;
  reviewNotes: string;
  runTitle: string;
  statusLabel: string;
  uploadedAtLabel: string;
};

export type OperatorDashboardData = {
  activeBookings: OperatorActiveBooking[];
  badgeLabel: string;
  badgeTone: BadgeTone;
  driverOptions: OperatorDriverOption[];
  incomingOffers: OperatorIncomingOffer[];
  inventorySlots: OperatorInventorySlot[];
  kpis: DashboardKpi[];
  proofReviews: OperatorProofReview[];
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
  executionLabel: string | null;
  id: string;
  message: string | null;
  operatorNote: string | null;
  proofLabel: string | null;
  proofTone: BadgeTone | null;
  slotTitle: string;
  statusLabel: string;
  statusTone: BadgeTone;
  updatedLabel: string;
};

export type PlannerMarketplaceData = {
  availableSlots: PlannerAvailableSlot[];
  badgeLabel: string;
  filterPills: PlannerFilterPill[];
  filterState: PlannerMarketplaceFilters;
  regions: RegionCode[];
  sourceLabel: string;
  submittedOffers: PlannerSubmittedOffer[];
  title: string;
};

export type DriverAssignedRun = {
  bookingStatusLabel: string;
  detail: string;
  id: string;
  latestProofReviewNotes: string | null;
  latestProofStatusLabel: string;
  proofCount: number;
  proofCountLabel: string;
  proofRequired: boolean;
  runStatus: RunRow['status'];
  statusLabel: string;
  title: string;
};

export type DriverUploadedProof = {
  capturedAtLabel: string;
  fileName: string;
  id: string;
  reviewNotes: string | null;
  reviewedAtLabel: string | null;
  runTitle: string;
  statusLabel: string;
  tone: BadgeTone;
};

export type DriverWorkspaceData = {
  assignedRuns: DriverAssignedRun[];
  badgeLabel: string;
  badgeTone: BadgeTone;
  proofCallout: string;
  proofUploads: DriverUploadedProof[];
  sourceLabel: string;
  title: string;
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  timeZone: 'America/Chicago',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  month: 'short',
  timeZone: 'America/Chicago',
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Chicago',
});

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(cents / 100);
}

function formatTimeWindow(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  return `${dateFormatter.format(start)} • ${timeFormatter.format(start)}-${timeFormatter.format(end)}`;
}

function formatDateTimeInput(isoValue: string) {
  return new Date(isoValue).toISOString().slice(0, 16);
}

function formatPlural(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatStatus(status: string) {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getStatusTone(status: string): BadgeTone {
  if (['accepted', 'approved', 'booked', 'completed', 'confirmed', 'live', 'running'].includes(status)) {
    return 'success';
  }

  return 'warning';
}

function getFileName(path: string) {
  const parts = path.split('/');
  return parts[parts.length - 1] ?? path;
}

function buildPlannerExecutionLabels(
  booking: Pick<BookingRow, 'campaign_name' | 'status'> | null | undefined,
  run: Pick<RunRow, 'proof_required' | 'scheduled_end_at' | 'scheduled_start_at' | 'status'> | null | undefined,
  proofs: Pick<ProofAssetRow, 'status'>[] = []
) {
  const latestProof = proofs[0] ?? null;

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
    executionLabel,
    proofLabel,
    proofTone,
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

export async function getOperatorDashboardData(): Promise<OperatorDashboardData> {
  const fallback: OperatorDashboardData = {
    activeBookings: [],
    badgeLabel: 'No active supply',
    badgeTone: 'warning',
    driverOptions: [],
    incomingOffers: [],
    inventorySlots: [],
    kpis: [
      { label: 'Tracked slots', value: '0' },
      { label: 'Pending offers', value: '0' },
      { label: 'Active campaigns', value: '0' },
      { label: 'Proof reviews', value: '0' },
    ],
    proofReviews: [],
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
  const [trucksResult, slotsResult, offersResult, bookingsResult, runsResult, proofAssetsResult, driversResult] = await Promise.all([
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
      .select('id, slot_id, planner_organization_id, status, campaign_name, internal_note')
      .eq('operator_organization_id', profile.organization_id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('runs')
      .select('id, booking_id, driver_id, scheduled_start_at, scheduled_end_at, status, proof_required')
      .order('scheduled_start_at'),
    supabase
      .from('proof_assets')
      .select('id, run_id, driver_id, storage_path, captured_at, created_at, status, review_notes')
      .order('created_at', { ascending: false }),
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
    runsResult.error ||
    proofAssetsResult.error ||
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
    'campaign_name' | 'id' | 'internal_note' | 'planner_organization_id' | 'slot_id' | 'status'
  >[];
  const runs = (runsResult.data ?? []) as Pick<
    RunRow,
    'booking_id' | 'driver_id' | 'id' | 'proof_required' | 'scheduled_end_at' | 'scheduled_start_at' | 'status'
  >[];
  const proofAssets = (proofAssetsResult.data ?? []) as Pick<
    ProofAssetRow,
    'captured_at' | 'created_at' | 'driver_id' | 'id' | 'review_notes' | 'run_id' | 'status' | 'storage_path'
  >[];
  const organizationDrivers = (driversResult.data ?? []) as Pick<
    ProfileRow,
    'email' | 'full_name' | 'id'
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
    'captured_at' | 'created_at' | 'driver_id' | 'id' | 'review_notes' | 'run_id' | 'status' | 'storage_path'
  >[]>();

  proofAssets.forEach((asset) => {
    const group = proofsByRun.get(asset.run_id) ?? [];
    group.push(asset);
    proofsByRun.set(asset.run_id, group);
  });

  const pendingOffers = offers.filter((offer) => offer.status === 'pending');
  const pendingProofReviews = proofAssets.filter((asset) => asset.status === 'uploaded');

  return {
    activeBookings: bookings.map((booking) => {
      const slot = slotMap.get(booking.slot_id);
      const truck = slot ? truckMap.get(slot.truck_id) : null;
      const run = runByBookingId.get(booking.id) ?? null;
      const proofs = run ? proofsByRun.get(run.id) ?? [] : [];
      const latestProof = proofs[0] ?? null;
      const assignedDriver = run?.driver_id ? drivers.get(run.driver_id) : null;
      return {
        bookingId: booking.id,
        bookingStatus: booking.status,
        campaignName: booking.campaign_name,
        dispatchEndAtInput: formatDateTimeInput(run?.scheduled_end_at ?? slot?.end_at ?? new Date().toISOString()),
        dispatchStartAtInput: formatDateTimeInput(run?.scheduled_start_at ?? slot?.start_at ?? new Date().toISOString()),
        driverId: run?.driver_id ?? '',
        driverLabel: assignedDriver?.full_name ?? assignedDriver?.email ?? 'No driver assigned',
        internalNote: booking.internal_note ?? '',
        latestProofStatusLabel: latestProof ? formatStatus(latestProof.status) : 'No proof yet',
        plannerLabel:
          plannerOrganizations.get(booking.planner_organization_id)?.name ?? 'Planner organization',
        proofRequired: run?.proof_required ?? true,
        proofCountLabel: `${formatPlural(proofs.length, 'proof')} logged`,
        runId: run?.id ?? null,
        runStatus: run?.status ?? null,
        scheduleLabel:
          run && slot
            ? `${buildSlotSummary(slot)} • ${formatStatus(run.status)}`
            : slot
              ? buildSlotSummary(slot)
              : 'Campaign schedule unavailable',
        slotTitle: truck ? `${truck.display_name} (${truck.vehicle_code})` : 'Truck inventory',
      };
    }),
    badgeLabel: pendingOffers.length > 0 ? `${formatPlural(pendingOffers.length, 'offer')} waiting` : `${formatPlural(slots.length, 'tracked slot')}`,
    badgeTone: slots.length > 0 ? 'success' : 'warning',
    driverOptions: organizationDrivers.map((driver) => ({
      id: driver.id,
      label: driver.full_name ?? driver.email,
    })),
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
    proofReviews: proofAssets.slice(0, 8).map((asset) => {
      const run = runs.find((entry) => entry.id === asset.run_id);
      const booking = run ? bookings.find((entry) => entry.id === run.booking_id) : null;
      const driver = drivers.get(asset.driver_id);
      return {
        canReview: asset.status === 'uploaded',
        driverLabel: driver?.full_name ?? driver?.email ?? 'Assigned driver',
        fileName: getFileName(asset.storage_path),
        id: asset.id,
        reviewNotes: asset.review_notes ?? '',
        runTitle: booking?.campaign_name ?? 'Assigned campaign',
        statusLabel: formatStatus(asset.status),
        uploadedAtLabel: asset.captured_at
          ? dateTimeFormatter.format(new Date(asset.captured_at))
          : dateTimeFormatter.format(new Date(asset.created_at)),
      };
    }),
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
  filters: PlannerMarketplaceFilters
): Promise<PlannerMarketplaceData> {
  const fallback: PlannerMarketplaceData = {
    availableSlots: [],
    badgeLabel: '0 slots visible',
    filterPills: [],
    filterState: filters,
    regions: ['DFW'],
    sourceLabel: 'Authenticated planner view',
    submittedOffers: [],
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
      .select('id, offer_id, slot_id, status, campaign_name, internal_note')
      .eq('planner_organization_id', profile.organization_id),
    supabase
      .from('runs')
      .select('id, booking_id, scheduled_start_at, scheduled_end_at, status, proof_required')
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
    'campaign_name' | 'id' | 'internal_note' | 'offer_id' | 'slot_id' | 'status'
  >[];
  const runs = (runsResult.data ?? []) as Pick<
    RunRow,
    'booking_id' | 'id' | 'proof_required' | 'scheduled_end_at' | 'scheduled_start_at' | 'status'
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
  const runByBookingId = new Map(runs.map((run) => [run.booking_id, run]));
  const proofsByRunId = new Map<string, Pick<ProofAssetRow, 'created_at' | 'id' | 'review_notes' | 'run_id' | 'status'>[]>();

  proofAssets.forEach((proof) => {
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
    badgeLabel: `${formatPlural(filteredSlots.length, 'slot')} visible`,
    filterPills,
    filterState: filters,
    regions: regions.length > 0 ? regions : fallback.regions,
    sourceLabel: organization?.name
      ? `Authenticated planner view for ${organization.name}`
      : 'Authenticated planner view',
    submittedOffers: offers.map((offer) => {
      const booking = bookingByOfferId.get(offer.id);
      const slot = slots.find((entry) => entry.id === offer.slot_id);
      const truck = slot ? truckMap.get(slot.truck_id) : null;
      const run = booking ? runByBookingId.get(booking.id) : null;
      const proofs = run ? proofsByRunId.get(run.id) ?? [] : [];
      const execution = buildPlannerExecutionLabels(booking, run, proofs);
      return {
        amountLabel: formatCurrency(offer.amount_cents),
        bookingLabel: booking ? `${formatStatus(booking.status)} • ${booking.campaign_name}` : null,
        executionLabel: execution.executionLabel,
        id: offer.id,
        message: offer.message,
        operatorNote: offer.operator_note ?? booking?.internal_note ?? null,
        proofLabel: execution.proofLabel,
        proofTone: execution.proofTone,
        slotTitle: truck ? `${truck.display_name} (${truck.vehicle_code})` : 'Truck inventory',
        statusLabel: formatStatus(offer.status),
        statusTone: getStatusTone(offer.status),
        updatedLabel: dateTimeFormatter.format(new Date(offer.updated_at)),
      };
    }),
    title: 'Search mobile inventory fast.',
  };
}

export async function getDriverWorkspaceData(): Promise<DriverWorkspaceData> {
  const fallback: DriverWorkspaceData = {
    assignedRuns: [],
    badgeLabel: 'Proof upload pending',
    badgeTone: 'warning',
    proofCallout: 'Supabase proof storage is wired, but no assigned run data is currently available.',
    proofUploads: [],
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
      .select('id, booking_id, scheduled_start_at, scheduled_end_at, status, proof_required')
      .eq('driver_id', profile.id)
      .order('scheduled_start_at'),
    supabase.from('bookings').select('id, campaign_name, status, internal_note'),
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
    'booking_id' | 'id' | 'proof_required' | 'scheduled_end_at' | 'scheduled_start_at' | 'status'
  >[];
  const bookings = (bookingsResult.data ?? []) as Pick<
    BookingRow,
    'campaign_name' | 'id' | 'internal_note' | 'status'
  >[];
  const proofAssets = (proofAssetsResult.data ?? []) as Pick<
    ProofAssetRow,
    'captured_at' | 'created_at' | 'id' | 'review_notes' | 'reviewed_at' | 'run_id' | 'status' | 'storage_path'
  >[];

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

  return {
    assignedRuns: runs.map((run) => {
      const booking = bookingMap.get(run.booking_id);
      const proofs = proofsByRun.get(run.id) ?? [];
      const latestProof = proofs[0] ?? null;
      return {
        bookingStatusLabel: booking ? formatStatus(booking.status) : 'Booking pending',
        detail: `${formatTimeWindow(run.scheduled_start_at, run.scheduled_end_at)} • ${formatStatus(run.status)}`,
        id: run.id,
        latestProofReviewNotes: latestProof?.review_notes ?? booking?.internal_note ?? null,
        latestProofStatusLabel: latestProof ? formatStatus(latestProof.status) : 'Awaiting first upload',
        proofCount: proofs.length,
        proofCountLabel: `${formatPlural(proofs.length, 'proof')} logged`,
        proofRequired: run.proof_required,
        runStatus: run.status,
        statusLabel: formatStatus(run.status),
        title: booking?.campaign_name ?? 'Assigned campaign',
      };
    }),
    badgeLabel:
      approvedProofs.length > 0
        ? `${formatPlural(approvedProofs.length, 'proof')} approved`
        : 'Proof review pending',
    badgeTone: approvedProofs.length > 0 ? 'success' : 'warning',
    proofCallout:
      proofAssets.length > 0
        ? `${formatPlural(proofAssets.length, 'proof file')} in review across your assigned runs.`
        : 'No proof assets have been uploaded yet for the seeded driver assignment.',
    proofUploads: proofAssets.map((asset) => {
      const run = runs.find((entry) => entry.id === asset.run_id);
      const booking = run ? bookingMap.get(run.booking_id) : null;
      return {
        capturedAtLabel: asset.captured_at
          ? dateTimeFormatter.format(new Date(asset.captured_at))
          : dateTimeFormatter.format(new Date(asset.created_at)),
        fileName: getFileName(asset.storage_path),
        id: asset.id,
        reviewNotes: asset.review_notes,
        reviewedAtLabel: asset.reviewed_at ? dateTimeFormatter.format(new Date(asset.reviewed_at)) : null,
        runTitle: booking?.campaign_name ?? 'Assigned campaign',
        statusLabel: formatStatus(asset.status),
        tone: getStatusTone(asset.status),
      };
    }),
    sourceLabel: `Authenticated driver view for ${profile.full_name ?? profile.email}`,
    title: 'Execute runs without call-chain chaos.',
  };
}
