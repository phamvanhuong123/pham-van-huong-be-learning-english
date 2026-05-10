import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  CLIENT_URL: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  DATABASE_URL: z.string(),

  // ── Email / SMTP ────────────────────────────────────────────────
  // Để trống trong dev → tự động dùng Ethereal test account
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 587)),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(), // Ví dụ: "TOEIC Master <noreply@yourapp.com>"
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;

if (env.NODE_ENV === 'production' && env.JWT_ACCESS_SECRET.length < 32) {
  throw new Error("❌ JWT_ACCESS_SECRET must be at least 32 characters long in production");
}
