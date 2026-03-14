import { z } from 'zod';

export const roleSchema = z.enum(['operator', 'planner', 'driver']);
export const recordIdSchema = z.string().regex(/^[0-9a-fA-F-]{36}$/, 'Invalid id.');
export const campaignRecapShareTokenSchema = z.string().regex(/^[0-9a-f]{64}$/i, 'Invalid campaign recap share token.');
export const bookingStatusSchema = z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']);
export const runStatusSchema = z.enum(['assigned', 'en_route', 'live', 'completed', 'issue']);
export const campaignExecutionIntentSchema = z.enum(['cancel', 'pause', 'resolve', 'save']);
export const campaignCloseoutIntentSchema = z.enum(['mark_client_ready', 'mark_closed']);
export const campaignPublicShareIntentSchema = z.enum(['create', 'revoke']);
export const campaignExecutionSchema = z.object({
  bookingId: recordIdSchema,
  bookingStatus: bookingStatusSchema,
  driverId: recordIdSchema.optional(),
  endAt: z.string().min(16),
  internalNote: z.string().trim().max(280).optional(),
  issueNote: z.string().trim().max(280).optional(),
  intent: campaignExecutionIntentSchema.optional(),
  proofRequired: z.union([z.literal('on'), z.literal('true'), z.literal('false')]).optional(),
  runStatus: runStatusSchema.optional(),
  startAt: z.string().min(16),
});
export const campaignCloseoutSchema = z.object({
  bookingId: recordIdSchema,
  intent: campaignCloseoutIntentSchema,
  note: z.string().trim().max(280).optional(),
});
export const campaignPublicShareSchema = z.object({
  bookingId: recordIdSchema,
  intent: campaignPublicShareIntentSchema,
});

export const slotCardSchema = z.object({
  id: z.string(),
  truckName: z.string(),
  region: z.string(),
  dateLabel: z.string(),
  priceLabel: z.string(),
});

export type Role = z.infer<typeof roleSchema>;
export type SlotCard = z.infer<typeof slotCardSchema>;
export type CampaignExecutionInput = z.infer<typeof campaignExecutionSchema>;
export type CampaignCloseoutInput = z.infer<typeof campaignCloseoutSchema>;
export type CampaignPublicShareInput = z.infer<typeof campaignPublicShareSchema>;
