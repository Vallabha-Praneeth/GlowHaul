import 'server-only';
import type { AppRole } from './auth';
import { formatOptionalDateTime, getFileName } from './formatters';
import { isNotificationEmailConfigured } from './env';
import { sendNotificationEmails } from './notification-email';
import { createAdminSupabaseClient } from './supabase/admin';
import { createServerSupabaseClient } from './supabase/server';
import type { Database } from '../../../packages/supabase/types/database';

type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
type NotificationRow = Database['public']['Tables']['notifications']['Row'];
type NotificationKind = Database['public']['Enums']['notification_kind'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type BookingRow = Database['public']['Tables']['bookings']['Row'];
type OfferRow = Database['public']['Tables']['offers']['Row'];
type RunRow = Database['public']['Tables']['runs']['Row'];
type ProofAssetRow = Database['public']['Tables']['proof_assets']['Row'];
type NotificationMetadata = Record<string, boolean | number | string | null>;
type DispatchIntent = 'assign' | 'remove' | 'update' | 'cancel' | 'pause' | 'resolve';
type DispatchIntentInput = DispatchIntent | 'save';
type RecipientProfile = Pick<ProfileRow, 'email' | 'full_name' | 'id'>;

export type NotificationCenterItem = {
  actionHref: string;
  body: string;
  createdAtLabel: string;
  href: string;
  id: string;
  isUnread: boolean;
  kindLabel: string;
  title: string;
  tone: 'success' | 'warning';
};

export type NotificationCenterData = {
  items: NotificationCenterItem[];
  unreadCount: number;
};

type BookingNotificationContext = Pick<
  BookingRow,
  'campaign_name' | 'id' | 'operator_organization_id' | 'planner_organization_id'
>;

type RunNotificationContext = {
  booking: BookingNotificationContext;
  run: Pick<RunRow, 'booking_id' | 'driver_id' | 'id' | 'status'>;
};

type ProofNotificationContext = RunNotificationContext & {
  proof: Pick<ProofAssetRow, 'driver_id' | 'id' | 'run_id' | 'status' | 'storage_path'>;
};

function requireAdminClient(context: string, details: NotificationMetadata = {}) {
  const admin = createAdminSupabaseClient();

  if (!admin) {
    console.error('Notification admin client is unavailable.', notificationErrorContext(context, details));
    return null;
  }

  return admin;
}

function getKindLabel(kind: NotificationKind) {
  switch (kind) {
    case 'offer_accepted':
      return 'Offer accepted';
    case 'campaign_client_ready':
      return 'Client-ready';
    case 'campaign_closed':
      return 'Closed';
    case 'dispatch_updated':
      return 'Dispatch update';
    case 'run_issue_reported':
      return 'Run issue';
    case 'proof_uploaded':
      return 'Proof uploaded';
    case 'proof_reviewed':
      return 'Proof reviewed';
    default:
      return 'Notification';
  }
}

function getNotificationTone(kind: NotificationKind, metadata: NotificationMetadata | null) {
  if (kind === 'run_issue_reported') {
    return 'warning' as const;
  }

  if (kind === 'dispatch_updated') {
    const intent = typeof metadata?.intent === 'string' ? metadata.intent as DispatchIntent : null;

    if (intent === 'cancel' || intent === 'pause' || intent === 'remove') {
      return 'warning' as const;
    }
  }

  if (kind === 'proof_reviewed' && metadata?.status === 'rejected') {
    return 'warning' as const;
  }

  return 'success' as const;
}

function notificationErrorContext(context: string, details: NotificationMetadata) {
  return {
    context,
    ...details,
  };
}

function deriveDispatchIntent(input: {
  intent?: DispatchIntentInput | null;
  isAssignedDriver: boolean;
  isRemovedDriver: boolean;
  previousDriverId?: string | null;
  targetDriverId?: string | null;
}): DispatchIntent {
  if (input.intent === 'cancel' || input.intent === 'pause' || input.intent === 'resolve') {
    return input.intent;
  }

  if (input.isRemovedDriver) {
    return 'remove';
  }

  if (input.isAssignedDriver && input.previousDriverId !== input.targetDriverId) {
    return 'assign';
  }

  return 'update';
}

async function getOrganizationRoleRecipientIds(
  organizationId: string,
  role: AppRole
) {
  const admin = requireAdminClient('getOrganizationRoleRecipientIds', {
    organizationId,
    role,
  });

  if (!admin) {
    return [];
  }

  const { data, error } = await admin
    .from('profiles')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('role', role);

  if (error) {
    console.error('Failed to load notification recipients.', notificationErrorContext('getOrganizationRoleRecipientIds', {
      organizationId,
      role,
      error: error.message,
    }));
    return [];
  }

  return (data ?? []).map((profile) => profile.id);
}

async function getBookingNotificationContext(bookingId: string) {
  const admin = requireAdminClient('getBookingNotificationContext', { bookingId });

  if (!admin) {
    return null;
  }

  const { data, error } = await admin
    .from('bookings')
    .select('id, campaign_name, operator_organization_id, planner_organization_id')
    .eq('id', bookingId)
    .maybeSingle();

  if (error || !data) {
    console.error('Failed to load booking notification context.', notificationErrorContext('getBookingNotificationContext', {
      bookingId,
      error: error?.message ?? 'missing booking',
    }));
    return null;
  }

  return data as BookingNotificationContext;
}

async function getRunNotificationContext(runId: string): Promise<RunNotificationContext | null> {
  const admin = requireAdminClient('getRunNotificationContext', { runId });

  if (!admin) {
    return null;
  }

  const { data: runData, error: runError } = await admin
    .from('runs')
    .select('id, booking_id, driver_id, status')
    .eq('id', runId)
    .maybeSingle();

  if (runError || !runData) {
    console.error('Failed to load run notification context.', notificationErrorContext('getRunNotificationContext', {
      runId,
      error: runError?.message ?? 'missing run',
    }));
    return null;
  }

  const booking = await getBookingNotificationContext(runData.booking_id);

  if (!booking) {
    return null;
  }

  return {
    booking,
    run: runData as Pick<RunRow, 'booking_id' | 'driver_id' | 'id' | 'status'>,
  };
}

async function getProofNotificationContext(proofAssetId: string): Promise<ProofNotificationContext | null> {
  const admin = requireAdminClient('getProofNotificationContext', { proofAssetId });

  if (!admin) {
    return null;
  }

  const { data: proofData, error: proofError } = await admin
    .from('proof_assets')
    .select('id, driver_id, run_id, status, storage_path')
    .eq('id', proofAssetId)
    .maybeSingle();

  if (proofError || !proofData) {
    console.error('Failed to load proof notification context.', notificationErrorContext('getProofNotificationContext', {
      proofAssetId,
      error: proofError?.message ?? 'missing proof',
    }));
    return null;
  }

  const runContext = await getRunNotificationContext(proofData.run_id);

  if (!runContext) {
    return null;
  }

  return {
    ...runContext,
    proof: proofData as Pick<ProofAssetRow, 'driver_id' | 'id' | 'run_id' | 'status' | 'storage_path'>,
  };
}

async function insertNotifications(records: NotificationInsert[]) {
  if (records.length === 0) {
    return;
  }
  const admin = requireAdminClient('insertNotifications', { count: records.length });

  if (!admin) {
    return;
  }

  const deduped = Array.from(
    new Map(
      records.map((record) => [
        `${record.recipient_profile_id}:${record.kind}:${record.href}`,
        record,
      ])
    ).values()
  );

  const { error } = await admin.from('notifications').insert(deduped);

  if (error) {
    console.error('Failed to insert notifications.', notificationErrorContext('insertNotifications', {
      count: deduped.length,
      error: error.message,
    }));
  }
}

function buildRecords(
  recipientProfileIds: string[],
  input: Omit<NotificationInsert, 'recipient_profile_id'>
) {
  return recipientProfileIds.map((recipientProfileId) => ({
    ...input,
    recipient_profile_id: recipientProfileId,
  }));
}

async function getRecipientProfiles(profileIds: string[]) {
  if (profileIds.length === 0) {
    return [];
  }

  const admin = requireAdminClient('getRecipientProfiles', { count: profileIds.length });

  if (!admin) {
    return [];
  }

  const { data, error } = await admin
    .from('profiles')
    .select('id, email, full_name')
    .in('id', profileIds);

  if (error) {
    console.error('Failed to load notification email recipients.', notificationErrorContext('getRecipientProfiles', {
      count: profileIds.length,
      error: error.message,
    }));
    return [];
  }

  return (data ?? []) as RecipientProfile[];
}

async function maybeDeliverEmails(
  recipientIds: string[],
  emailInput: Omit<Parameters<typeof sendNotificationEmails>[0], 'recipients'>
) {
  if (!isNotificationEmailConfigured() || recipientIds.length === 0) {
    return;
  }

  const recipients = await getRecipientProfiles(recipientIds);
  if (recipients.length === 0) {
    return;
  }

  await sendNotificationEmails({
    ...emailInput,
    recipients: recipients.map((recipient) => ({
      email: recipient.email,
      name: recipient.full_name,
      profileId: recipient.id,
    })),
  });
}

export async function getNotificationCenterData(profileId: string): Promise<NotificationCenterData> {
  const supabase = await createServerSupabaseClient();
  const [
    { data, error },
    { count: unreadCount, error: unreadCountError },
  ] = await Promise.all([
    supabase
      .from('notifications')
      .select('id, title, body, href, kind, read_at, created_at, metadata')
      .eq('recipient_profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_profile_id', profileId)
      .is('read_at', null),
  ]);

  if (error || unreadCountError) {
    console.error('Failed to load notification center data.', notificationErrorContext('getNotificationCenterData', {
      profileId,
      error: error?.message ?? unreadCountError?.message ?? 'unknown error',
    }));
    return {
      items: [],
      unreadCount: 0,
    };
  }

  const notifications = (data ?? []) as Array<
    Pick<NotificationRow, 'body' | 'created_at' | 'href' | 'id' | 'kind' | 'metadata' | 'read_at' | 'title'>
  >;
  return {
    items: notifications.map((item) => ({
      actionHref: `/notifications/${item.id}`,
      body: item.body,
      createdAtLabel: formatOptionalDateTime(item.created_at) ?? 'Recently',
      href: item.href,
      id: item.id,
      isUnread: item.read_at === null,
      kindLabel: getKindLabel(item.kind),
      title: item.title,
      tone: getNotificationTone(item.kind, item.metadata as NotificationMetadata | null),
    })),
    unreadCount: unreadCount ?? 0,
  };
}

export async function markAllNotificationsRead(profileId: string) {
  const supabase = await createServerSupabaseClient();
  // Supabase's generated update type narrows to `never` here despite the table exposing `Update`.
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() } as never)
    .eq('recipient_profile_id', profileId)
    .is('read_at', null);

  if (error) {
    console.error('Failed to mark notifications as read.', notificationErrorContext('markAllNotificationsRead', {
      profileId,
      error: error.message,
    }));
    return false;
  }

  return true;
}

export async function notifyPlannerOfferAccepted(input: {
  actorProfileId: string;
  campaignName: string;
  offerId: string;
}) {
  const admin = requireAdminClient('notifyPlannerOfferAccepted', {
    actorProfileId: input.actorProfileId,
    offerId: input.offerId,
  });

  if (!admin) {
    return;
  }

  const { data, error } = await admin
    .from('offers')
    .select('id, planner_organization_id')
    .eq('id', input.offerId)
    .maybeSingle();

  if (error || !data) {
    console.error('Failed to load accepted offer notification context.', notificationErrorContext('notifyPlannerOfferAccepted', {
      offerId: input.offerId,
      error: error?.message ?? 'missing offer',
    }));
    return;
  }

  const recipientIds = await getOrganizationRoleRecipientIds(data.planner_organization_id, 'planner');
  const body = `${input.campaignName} was booked by the operator and is now on the dispatch board.`;
  await insertNotifications(
    buildRecords(recipientIds, {
      actor_profile_id: input.actorProfileId,
      body,
      href: '/planner/search',
      kind: 'offer_accepted',
      offer_id: input.offerId,
      title: 'Offer accepted',
    })
  );

  await maybeDeliverEmails(recipientIds, {
    bodyText: body,
    href: '/planner/search',
    idempotencyKey: `offer-accepted/${input.offerId}`,
    subject: `Offer accepted for ${input.campaignName}`,
  });
}

export async function notifyPlannerCampaignCloseout(input: {
  actorProfileId: string;
  bookingId: string;
  kind: 'campaign_client_ready' | 'campaign_closed';
}) {
  const booking = await getBookingNotificationContext(input.bookingId);

  if (!booking) {
    return;
  }

  const recipientIds = await getOrganizationRoleRecipientIds(booking.planner_organization_id, 'planner');
  await insertNotifications(
    buildRecords(recipientIds, {
      actor_profile_id: input.actorProfileId,
      body:
        input.kind === 'campaign_client_ready'
          ? `${booking.campaign_name} is now client-ready and the recap can be delivered.`
          : `${booking.campaign_name} is fully closed and archived for follow-up.`,
      booking_id: booking.id,
      href: `/campaigns/${booking.id}`,
      kind: input.kind,
      title: input.kind === 'campaign_client_ready' ? 'Campaign client-ready' : 'Campaign closed',
    })
  );
}

export async function notifyOperatorRunIssueReported(input: {
  actorProfileId: string;
  issueNote: string | null;
  runId: string;
}) {
  const context = await getRunNotificationContext(input.runId);

  if (!context) {
    return;
  }

  const recipientIds = await getOrganizationRoleRecipientIds(context.booking.operator_organization_id, 'operator');
  const body = input.issueNote
    ? `${context.booking.campaign_name} was paused with issue: ${input.issueNote}`
    : `${context.booking.campaign_name} was paused because the driver reported an issue.`;
  await insertNotifications(
    buildRecords(recipientIds, {
      actor_profile_id: input.actorProfileId,
      body,
      booking_id: context.booking.id,
      href: '/operator',
      kind: 'run_issue_reported',
      run_id: context.run.id,
      title: 'Driver reported an issue',
    })
  );

  await maybeDeliverEmails(recipientIds, {
    bodyText: body,
    href: '/operator',
    idempotencyKey: `run-issue/${context.run.id}`,
    subject: `Driver issue reported for ${context.booking.campaign_name}`,
  });
}

export async function notifyOperatorProofUploaded(input: {
  actorProfileId: string;
  proofAssetId: string;
  runId: string;
}) {
  const context = await getProofNotificationContext(input.proofAssetId);

  if (!context) {
    return;
  }

  if (context.run.id !== input.runId) {
    console.error(
      'Proof upload notification context mismatch.',
      notificationErrorContext('notifyOperatorProofUploaded', {
        contextRunId: context.run.id,
        proofAssetId: input.proofAssetId,
        runId: input.runId,
      }),
    );
    return;
  }

  const recipientIds = await getOrganizationRoleRecipientIds(context.booking.operator_organization_id, 'operator');
  await insertNotifications(
    buildRecords(recipientIds, {
      actor_profile_id: input.actorProfileId,
      body: `${context.booking.campaign_name} uploaded ${getFileName(context.proof.storage_path)} for operator review.`,
      booking_id: context.booking.id,
      href: '/operator',
      kind: 'proof_uploaded',
      proof_asset_id: input.proofAssetId,
      run_id: context.run.id,
      title: 'New proof uploaded',
    })
  );
}

export async function notifyDriverProofReviewed(input: {
  actorProfileId: string;
  proofAssetId: string;
}) {
  const context = await getProofNotificationContext(input.proofAssetId);

  if (!context) {
    return;
  }

  const body =
    context.proof.status === 'approved'
      ? `${context.booking.campaign_name} proof ${getFileName(context.proof.storage_path)} was approved and is ready for planner/share workflows.`
      : `${context.booking.campaign_name} proof ${getFileName(context.proof.storage_path)} was rejected. Review the operator note and upload a replacement.`;
  const title = context.proof.status === 'approved' ? 'Proof approved' : 'Proof rejected';
  await insertNotifications(
    buildRecords([context.proof.driver_id], {
      actor_profile_id: input.actorProfileId,
      body,
      booking_id: context.booking.id,
      href: '/driver',
      kind: 'proof_reviewed',
      metadata: {
        status: context.proof.status,
      },
      proof_asset_id: context.proof.id,
      run_id: context.run.id,
      title,
    })
  );

  await maybeDeliverEmails([context.proof.driver_id], {
    bodyText: body,
    href: '/driver',
    idempotencyKey: `proof-reviewed/${context.proof.id}`,
    subject: `${title} for ${context.booking.campaign_name}`,
  });
}

export async function notifyDriversDispatchUpdated(input: {
  actorProfileId: string;
  bookingId: string;
  previousDriverId?: string | null;
  targetDriverId?: string | null;
  intent?: DispatchIntentInput | null;
}) {
  const booking = await getBookingNotificationContext(input.bookingId);

  if (!booking) {
    return;
  }

  const recipientIds = Array.from(
    new Set([input.previousDriverId ?? null, input.targetDriverId ?? null].filter(Boolean) as string[])
  );

  if (recipientIds.length === 0) {
    return;
  }

  const notifications = recipientIds.map((recipientId) => {
    const isRemovedDriver = input.previousDriverId === recipientId && input.targetDriverId !== recipientId;
    const isAssignedDriver = input.targetDriverId === recipientId;
    const dispatchIntent = deriveDispatchIntent({
      intent: input.intent,
      isAssignedDriver,
      isRemovedDriver,
      previousDriverId: input.previousDriverId,
      targetDriverId: input.targetDriverId,
    });
    let title = 'Dispatch updated';
    let body = `${booking.campaign_name} dispatch details changed. Open the driver workspace for the new plan.`;

    if (dispatchIntent === 'cancel') {
      title = 'Campaign cancelled';
      body = `${booking.campaign_name} was cancelled by the operator.`;
    } else if (dispatchIntent === 'pause') {
      title = 'Run paused';
      body = `${booking.campaign_name} was paused by the operator while the issue is being handled.`;
    } else if (dispatchIntent === 'resolve') {
      title = 'Run resumed';
      body = `${booking.campaign_name} was resumed by the operator.`;
    } else if (isRemovedDriver) {
      title = 'Assignment removed';
      body = `${booking.campaign_name} was removed from your active dispatch queue.`;
    } else if (isAssignedDriver && input.previousDriverId !== input.targetDriverId) {
      title = 'New assignment';
      body = `${booking.campaign_name} was assigned to you. Review the dispatch details in your workspace.`;
    }

    return {
      actor_profile_id: input.actorProfileId,
      body,
      booking_id: booking.id,
      href: '/driver',
      kind: 'dispatch_updated' as const,
      metadata: {
        intent: dispatchIntent,
      },
      recipient_profile_id: recipientId,
      title,
    } satisfies NotificationInsert;
  });

  await insertNotifications(notifications);
}
