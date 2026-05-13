import { SubStatus } from '@prisma/client';

export interface CreateSubscriptionBody {
  plan: '1m' | '3m' | '12m';
}

export interface SubscriptionResponse {
  id: string;
  userId: string;
  plan: string;
  status: SubStatus;
  proofUrl: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}
