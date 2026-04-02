import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com';

export const resend = new Resend(RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, otp: string): Promise<void> {
  if (!RESEND_API_KEY) {
    // Development fallback — log to console when Resend is not configured
    console.log(`[Resend] Password reset OTP for ${to}: ${otp}`);
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Reset Password - OTP Code',
    html: `
      <p>Your password reset OTP code is:</p>
      <h2>${otp}</h2>
      <p>This code expires in 15 minutes.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    `,
  });
}
