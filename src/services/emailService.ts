import { getTransporter, getPreviewUrl } from '../config/mailer';
import {
  verifyEmailTemplate,
  resetPasswordTemplate,
  passwordChangedTemplate,
} from '../utils/emailTemplates';
import { env } from '../config/env';

const FROM = `"TOEIC Master" <${env.SMTP_FROM || env.SMTP_USER || 'noreply@toeicmaster.vn'}>`;

/** Kiểu lỗi email nội bộ — không expose ra client */
export class EmailDeliveryError extends Error {
  constructor(
    public readonly recipient: string,
    public readonly type: 'verification' | 'reset-password' | 'password-changed',
    cause?: unknown,
  ) {
    super(`[Email] Gửi email "${type}" tới ${recipient} thất bại`);
    this.name = 'EmailDeliveryError';
    if (cause instanceof Error) this.cause = cause;
  }
}

/** Helper: ghi log kết quả sau khi gửi thành công */
const logSent = (type: string, to: string, info: Awaited<ReturnType<Awaited<ReturnType<typeof getTransporter>>['sendMail']>>) => {
  const previewUrl = getPreviewUrl(info);
  if (previewUrl) {
    console.log(`📧 [Email][${type}] Ethereal preview → ${previewUrl}`);
  } else {
    console.log(`📧 [Email][${type}] Đã gửi tới ${to} — MessageId: ${info.messageId}`);
  }
};

/* ══════════════════════════════════════════════════════════════
   1. Gửi email xác thực tài khoản (Register)
   ⚠️  Throw EmailDeliveryError nếu thất bại → caller phải rollback
══════════════════════════════════════════════════════════════ */
export const sendVerificationEmail = async (params: {
  to: string;
  name: string;
  token: string;
}) => {
  const { to, name, token } = params;
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: FROM,
      to,
      subject: 'Xác thực email — TOEIC Master',
      html: verifyEmailTemplate({ name, verifyUrl, clientUrl: env.CLIENT_URL }),
      text: `Xác thực tài khoản TOEIC Master của bạn tại: ${verifyUrl}`,
    });
    logSent('verification', to, info);
  } catch (err) {
    console.error(`❌ [Email][verification] Gửi tới ${to} thất bại:`, err);
    // Ném lên để authService.registerUser rollback user vừa tạo
    throw new EmailDeliveryError(to, 'verification', err);
  }
};

/* ══════════════════════════════════════════════════════════════
   2. Gửi email đặt lại mật khẩu (Forgot Password)
   ℹ️  Không throw ra ngoài — lỗi chỉ ghi log (tránh lộ thông tin)
══════════════════════════════════════════════════════════════ */
export const sendResetPasswordEmail = async (params: {
  to: string;
  name: string;
  token: string;
}) => {
  const { to, name, token } = params;
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: FROM,
      to,
      subject: 'Đặt lại mật khẩu — TOEIC Master',
      html: resetPasswordTemplate({ name, resetUrl, clientUrl: env.CLIENT_URL }),
      text: `Đặt lại mật khẩu TOEIC Master của bạn tại: ${resetUrl}`,
    });
    logSent('reset-password', to, info);
  } catch (err) {
    // Không throw — forgotPassword luôn trả 200 dù email có tồn tại hay không
    console.error(`❌ [Email][reset-password] Gửi tới ${to} thất bại:`, err);
  }
};

/* ══════════════════════════════════════════════════════════════
   3. Gửi email thông báo đổi mật khẩu thành công
   ℹ️  Không throw ra ngoài — mật khẩu đã đổi, email chỉ là thông báo phụ
══════════════════════════════════════════════════════════════ */
export const sendPasswordChangedEmail = async (params: {
  to: string;
  name: string;
}) => {
  const { to, name } = params;

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: FROM,
      to,
      subject: 'Mật khẩu đã được thay đổi — TOEIC Master',
      html: passwordChangedTemplate({ name, clientUrl: env.CLIENT_URL }),
      text: `Mật khẩu tài khoản TOEIC Master của bạn (${to}) đã được thay đổi thành công.`,
    });
    logSent('password-changed', to, info);
  } catch (err) {
    // Không throw — mật khẩu đã đổi thành công, email chỉ là thông báo bổ sung
    console.error(`❌ [Email][password-changed] Gửi tới ${to} thất bại:`, err);
  }
};
