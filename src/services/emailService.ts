import { getTransporter, getPreviewUrl } from '../config/mailer';
import {
  verifyEmailTemplate,
  resetPasswordTemplate,
  passwordChangedTemplate,
  vocabReminderTemplate,
} from '../utils/emailTemplates';

import { env } from '../config/env';

const FROM = `"TOEIC Master" <${env.SMTP_FROM || env.SMTP_USER || 'noreply@toeicmaster.vn'}>`;

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

const logSent = (type: string, to: string, info: Awaited<ReturnType<Awaited<ReturnType<typeof getTransporter>>['sendMail']>>) => {
  const previewUrl = getPreviewUrl(info);
  if (previewUrl) {
    console.log(`[Email][${type}] Ethereal preview → ${previewUrl}`);
  } else {
    console.log(`[Email][${type}] Đã gửi tới ${to} — MessageId: ${info.messageId}`);
  }
};
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
    console.error(`[Email][verification] Gửi tới ${to} thất bại:`, err);
    throw new EmailDeliveryError(to, 'verification', err);
  }
};

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
    console.error(`[Email][reset-password] Gửi tới ${to} thất bại:`, err);
  }
};
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
    console.error(`[Email][password-changed] Gửi tới ${to} thất bại:`, err);
  }
};
export const sendVocabReminderEmail = async (params: {
  to: string;
  name: string;
  count: number;
}) => {
  const { to, name, count } = params;

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: FROM,
      to,
      subject: `Ôn từ vựng hôm nay: ${count} từ đang đợi bạn — TOEIC Master`,
      html: vocabReminderTemplate({ name, count, clientUrl: env.CLIENT_URL }),
      text: `Bạn có ${count} từ vựng cần ôn hôm nay trên TOEIC Master. Truy cập: ${env.CLIENT_URL}/dashboard/vocab/practice`,
    });
    logSent('vocab-reminder', to, info);
  } catch (err) {
    console.error(`[Email][vocab-reminder] Gửi tới ${to} thất bại:`, err);
  }
};
