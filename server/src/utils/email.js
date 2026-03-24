import { Resend } from 'resend';
import config from '../config/env.js';
import logger from './logger.js';

const resend = new Resend(config.resend.apiKey);

export async function sendSetPasswordEmail(toEmail, token) {
  const link = `${config.clientUrl}/auth/set-password?token=${token}`;

  const { error } = await resend.emails.send({
    from: config.resend.fromEmail,
    to: toEmail,
    subject: 'Set Your Password — FPO Farmer Management',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4B9B4D;">Set Your Password</h2>
        <p>You requested to set a password for your account so you can log in with email and password.</p>
        <a href="${link}" style="display: inline-block; padding: 12px 24px; background: #4B9B4D; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Set Password
        </a>
        <p style="color: #888; font-size: 13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    logger.error('Failed to send set-password email', { error: error.message, to: toEmail });
    throw new Error('Failed to send email');
  }
}
