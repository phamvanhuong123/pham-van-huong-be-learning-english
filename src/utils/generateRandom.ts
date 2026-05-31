import crypto from 'crypto';


export const hashToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateRandomToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashToken(token)
  return { token, hashedToken };
};


