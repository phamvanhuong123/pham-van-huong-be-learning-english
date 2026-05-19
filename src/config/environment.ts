import "dotenv/config";
export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  BUILD_MODE: process.env.BUILD_MODE,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,
  ACCESS_TOKEN_SECRET_SIGNATURE : process.env.ACCESS_TOKEN_SECRET_SIGNATURE,
  REFRESH_TOKEN_SECRET_SIGNATURE : process.env.REFRESH_TOKEN_SECRET_SIGNATURE
};
