import nodemailer from 'nodemailer';
import { env } from './env';

/**
 * Tạo transporter Nodemailer.
 * - Production / có SMTP config: dùng SMTP thật (Gmail, SendGrid, v.v.)
 * - Development không có config: tự tạo Ethereal test account và in link preview vào console
 */
let _transporter: nodemailer.Transporter | null = null;

export const getTransporter = async (): Promise<nodemailer.Transporter> => {
  if (_transporter) return _transporter;

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    // ── Production / explicit SMTP config ──────────────────────────────────
    _transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // true = SSL, false = STARTTLS (587)
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    await _transporter.verify();
    console.log(`✅ [Mailer] Kết nối SMTP thành công: ${env.SMTP_HOST}:${env.SMTP_PORT}`);
  } else {
    // ── Development fallback: Ethereal (email test ảo, xem trên web) ──────
    console.warn('⚠️  [Mailer] Không tìm thấy SMTP config — dùng Ethereal test account');
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`🔗 [Mailer] Ethereal account: ${testAccount.user}`);
  }

  return _transporter;
};

/** Lấy URL preview email nếu đang dùng Ethereal (chỉ có trong dev) */
export const getPreviewUrl = (info: nodemailer.SentMessageInfo): string | null => {
  const url = nodemailer.getTestMessageUrl(info);
  return url ? String(url) : null;
};
