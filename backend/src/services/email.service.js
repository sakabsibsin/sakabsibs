import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = new Resend(env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (toEmail, resetLink) => {
  const { data, error } = await resend.emails.send({
    from: 'Sakab Sibs <onboarding@resend.dev>',
    to: toEmail,
    subject: 'Reset your Sakab Sibs admin password',
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #F5ECE0;">
        <h1 style="font-size: 24px; color: #4A1E1E; margin-bottom: 8px; letter-spacing: 0.05em;">
          SAKAB SIBS
        </h1>
        <p style="color: #4A1E1E; font-size: 14px; margin-bottom: 32px; opacity: 0.6;">
          Admin Password Reset
        </p>
        <p style="color: #4A1E1E; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          You requested a password reset for your Sakab Sibs admin account.
          Click the button below to set a new password.
        </p>
        <a href="${resetLink}"
           style="display: inline-block; background: #4A1E1E; color: #F5ECE0;
                  padding: 14px 32px; text-decoration: none; font-size: 14px;
                  letter-spacing: 0.1em; text-transform: uppercase;">
          Reset Password
        </a>
        <p style="color: #4A1E1E; font-size: 12px; margin-top: 32px; opacity: 0.5; line-height: 1.6;">
          This link expires in 1 hour. If you did not request this,
          ignore this email — your password will not change.
        </p>
        <p style="color: #4A1E1E; font-size: 12px; margin-top: 8px; opacity: 0.4;">
          Or copy this link: ${resetLink}
        </p>
      </div>
    `,
  });

  if (error) throw new Error(`Email send failed: ${error.message}`);
  return data;
};
