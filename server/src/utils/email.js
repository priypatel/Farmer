import { Resend } from 'resend';
import config from '../config/env.js';
import logger from './logger.js';

const resend = new Resend(config.resend.apiKey);

async function sendEmail(to, subject, html) {
  const { error } = await resend.emails.send({
    from: config.resend.fromEmail,
    to,
    subject,
    html,
  });

  if (error) {
    logger.error('Failed to send email', { error: error.message, to });
    throw new Error('Failed to send email');
  }
}

export async function sendSetPasswordEmail(toEmail, token) {
  const link = `${config.clientUrl}/auth/reset-password?token=${token}`;
  await sendEmail(
    toEmail,
    'Set Your Password — FPO Farmer Management',
    `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #4B9B4D;">Set Your Password</h2>
      <p>You requested to set a password for your account so you can log in with email and password.</p>
      <a href="${link}" style="display: inline-block; padding: 12px 24px; background: #4B9B4D; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">
        Set Password
      </a>
      <p style="color: #888; font-size: 13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>`
  );
}

export async function sendForgotPasswordEmail(toEmail, token) {
  const link = `${config.clientUrl}/auth/reset-password?token=${token}`;
  await sendEmail(
    toEmail,
    'Reset Your Password — FPO Farmer Management',
    `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #4B9B4D;">Reset Your Password</h2>
      <p>We received a request to reset your password. Click the button below to choose a new one.</p>
      <a href="${link}" style="display: inline-block; padding: 12px 24px; background: #4B9B4D; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">
        Reset Password
      </a>
      <p style="color: #888; font-size: 13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>`
  );
}
