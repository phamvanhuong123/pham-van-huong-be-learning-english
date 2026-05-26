import { } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        isSuperAdmin: boolean;
        permissions: string[];
      };
    }
  }
}
