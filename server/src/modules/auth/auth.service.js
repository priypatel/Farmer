import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../../config/env.js';
import { verifyGoogleToken } from '../../config/google.js';
import {
  findUserByEmail,
  freeDeletedUserEmail,
  freeDeletedUserGoogleId,
  findUserByGoogleId,
  createEmailUser,
  createGoogleUser,
  getUserById,
  createFarmerRecord,
  linkGoogleToUser,
  saveRefreshToken,
  findUserByRefreshToken,
  clearRefreshToken,
  setUserPassword,
  savePasswordResetToken,
  findUserByResetToken,
} from './auth.query.js';
import { sendSetPasswordEmail, sendForgotPasswordEmail } from '../../utils/email.js';

// ── Token helpers ───────────────────────────────────────────────────────────

function signTokens(payload) {
  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
  const refreshToken = jwt.sign({ id: payload.id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
  return { accessToken, refreshToken };
}

// ── Register ────────────────────────────────────────────────────────────────

export async function register(firstName, phone, email, password, role) {
  const existing = await findUserByEmail(email);
  if (existing) {
    const error = new Error('Email already registered');
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await freeDeletedUserEmail(email);

  const userId = await createEmailUser(firstName, phone, email, hashedPassword, role);
  if (role === 'farmer') {
    await createFarmerRecord(userId);
  }

  const { accessToken, refreshToken } = signTokens({ id: userId, role, email });
  await saveRefreshToken(userId, refreshToken);

  return {
    user: { id: userId, firstName, email, role },
    accessToken,
    refreshToken,
  };
}

// ── Login with email ────────────────────────────────────────────────────────

export async function loginWithEmail(email, password) {
  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  if (!user.password) {
    const error = new Error('You signed up with Google. Please set a password to use email login.');
    error.status = 403;
    error.code = 'PASSWORD_NOT_SET';
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  const { accessToken, refreshToken } = signTokens({
    id: user.id, role: user.role, email: user.email,
  });
  await saveRefreshToken(user.id, refreshToken);

  return {
    user: { id: user.id, firstName: user.first_name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  };
}

// ── Login with Google ───────────────────────────────────────────────────────

export async function loginWithGoogle(credential) {
  let payload;
  try {
    payload = await verifyGoogleToken(credential);
  } catch {
    const error = new Error('Invalid Google token');
    error.status = 401;
    throw error;
  }

  let user = await findUserByGoogleId(payload.sub);

  if (!user) {
    const existingEmail = await findUserByEmail(payload.email);
    if (existingEmail) {
      await linkGoogleToUser(existingEmail.id, payload.sub);
      user = await getUserById(existingEmail.id);
    } else {
      await freeDeletedUserEmail(payload.email);
      await freeDeletedUserGoogleId(payload.sub);
      const userId = await createGoogleUser(
        payload.given_name || payload.name || 'User',
        payload.email,
        payload.sub,
        'farmer'
      );
      await createFarmerRecord(userId);
      user = await getUserById(userId);
    }
  }

  const { accessToken, refreshToken } = signTokens({
    id: user.id, role: user.role, email: user.email,
  });
  await saveRefreshToken(user.id, refreshToken);

  return {
    user: { id: user.id, firstName: user.first_name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  };
}

// ── Refresh token ───────────────────────────────────────────────────────────

export async function refreshAccessToken(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.refreshSecret);
  } catch {
    const error = new Error('Invalid or expired refresh token');
    error.status = 401;
    throw error;
  }

  const user = await findUserByRefreshToken(token);
  if (!user || user.id !== decoded.id) {
    const error = new Error('Refresh token revoked');
    error.status = 401;
    throw error;
  }

  const { accessToken, refreshToken: newRefreshToken } = signTokens({
    id: user.id, role: user.role, email: user.email,
  });
  await saveRefreshToken(user.id, newRefreshToken);

  return {
    user: { id: user.id, firstName: user.first_name, email: user.email, role: user.role },
    accessToken,
    refreshToken: newRefreshToken,
  };
}

// ── Logout ──────────────────────────────────────────────────────────────────

export async function logout(userId) {
  if (userId) {
    await clearRefreshToken(userId);
  }
}

// ── Forgot password ─────────────────────────────────────────────────────────

export async function forgotPassword(email) {
  const user = await findUserByEmail(email);
  if (!user) return; // Silent — don't reveal if email exists

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await savePasswordResetToken(user.id, token, expires);

  if (!user.password) {
    // Google-only user — send set-password email
    await sendSetPasswordEmail(email, token);
  } else {
    await sendForgotPasswordEmail(email, token);
  }
}

// ── Reset / set password via token ──────────────────────────────────────────

export async function resetPassword(token, newPassword) {
  const user = await findUserByResetToken(token);
  if (!user) {
    const error = new Error('Invalid or expired reset link');
    error.status = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await setUserPassword(user.id, hashedPassword);
}

// ── Request set-password (Google-only users, from login page banner) ─────────

export async function requestSetPassword(email) {
  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }
  if (user.password) {
    const error = new Error('Password already set. Use forgot password instead.');
    error.status = 400;
    throw error;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000);
  await savePasswordResetToken(user.id, token, expires);
  await sendSetPasswordEmail(email, token);
}

// ── Get me ──────────────────────────────────────────────────────────────────

export async function getMe(userId) {
  const user = await getUserById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }
  return user;
}
