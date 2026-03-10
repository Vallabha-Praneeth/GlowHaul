import { z } from 'zod';

export const roleSchema = z.enum(['operator', 'planner', 'driver']);

export const slotCardSchema = z.object({
  id: z.string(),
  truckName: z.string(),
  region: z.string(),
  dateLabel: z.string(),
  priceLabel: z.string(),
});

export type Role = z.infer<typeof roleSchema>;
export type SlotCard = z.infer<typeof slotCardSchema>;
