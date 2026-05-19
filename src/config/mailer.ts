import { env } from '@/config/environment';
import nodemailer from 'nodemailer';

let _transporter: nodemailer.Transporter | null = null;

export const getTransporter = async (): Promise<nodemailer.Transporter> => {
  if (_transporter) return _transporter;

    _transporter = nodemailer.createTransport({
      host: env.SMTP_HOST as string,
      port: Number(env.SMTP_PORT),
      secure: Number(env.SMTP_PORT) === 465,
      auth: {
        user: env.SMTP_USER as string,
        pass: env.SMTP_PASS as string,
      },
    });
    //Test cấu hình
    await _transporter.verify();
  return _transporter;
};


//Test mail
export const getPreviewUrl = (info: nodemailer.SentMessageInfo): string | null => {
  const url = nodemailer.getTestMessageUrl(info);
  return url ? String(url) : null;
};