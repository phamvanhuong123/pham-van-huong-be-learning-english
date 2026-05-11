import nodemailer from 'nodemailer';
import { env } from './env';
let _transporter: nodemailer.Transporter | null = null;

export const getTransporter = async (): Promise<nodemailer.Transporter> => {
  if (_transporter) return _transporter;

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    _transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    await _transporter.verify();
  
  } else {
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
  }

  return _transporter;
};
export const getPreviewUrl = (info: nodemailer.SentMessageInfo): string | null => {
  const url = nodemailer.getTestMessageUrl(info);
  return url ? String(url) : null;
};
