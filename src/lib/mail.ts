import nodemailer from "nodemailer";
import { env } from "@/lib/env";

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const smtp = env.smtp();
  const subject = "Merchant Orders — password reset code";
  const text = `Your one-time password reset code is: ${otp}\n\nThis code expires in 15 minutes.`;
  const html = `<p>Your one-time password reset code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${otp}</p><p>This code expires in 15 minutes.</p>`;

  if (!smtp.host || !smtp.user || !smtp.pass) {
    console.log(`[Merchant Orders] OTP for ${to}: ${otp} (SMTP not configured)`);
    return;
  }

  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });

  await transport.sendMail({
    from: smtp.from,
    to,
    subject,
    text,
    html,
  });
}
