import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  plan: z.enum(['VIP_1_MONTH', 'VIP_3_MONTH', 'VIP_6_MONTH']),
  bankAccountNo: z.string().min(5).max(50),
  transactionRef: z.string().min(5).max(100),
  amount: z.coerce.number().int().positive()
});

export const rejectSubscriptionSchema = z.object({
  reason: z.string().min(5).max(500)
});

export const querySubscriptionSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  search: z.string().optional()
});
