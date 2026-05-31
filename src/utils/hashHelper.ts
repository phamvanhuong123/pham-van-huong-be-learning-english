import crypto from 'crypto';

export const hashHelper = {
  sha256: (data: string | Buffer): string => {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
};
