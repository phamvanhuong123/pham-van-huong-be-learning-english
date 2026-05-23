import { env } from "@/config/environment";
import { getTransporter } from "@/config/mailer";
import { EmailDeliveryError } from "@/utils/EmailDeliveryError";
import { verifyEmailTemplate } from "@/utils/emailTemplates";
import { MailOptions } from "nodemailer/lib/json-transport";

const CLIENT_URL = env.BUILD_MODE === "dev" ? "http://localhost:5173" : "abc";
const from = `"TOEIC Master" <${env.SMTP_FROM || env.SMTP_USER || "noreply@toeicmaster.vn"}>`;

const sendVerificationEmail = async (
  to: string,
  name: string,
  token: string,
) => {
  const verifyUrl = `${CLIENT_URL}/verify-email?token=${token}`;
  try {
    const mailOptions: MailOptions = {
      from: from,
      to: to,
      subject: "Xác thực email — TOEIC Master",
      html: verifyEmailTemplate({
        name,
        verifyUrl,
        expiresIn: "1 giờ",
        clientUrl: CLIENT_URL,
      }),
    };
    const transporter = await getTransporter();

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`[Email][verification] Gửi tới ${to} thất bại:`, error);
    throw new EmailDeliveryError(to, "verification", error);
  }
};

export const emailService = {
  sendVerificationEmail,
};
