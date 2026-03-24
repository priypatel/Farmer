import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../../config/env.js';
import { verifyGoogleToken } from '../../config/google.js';
import {
  findUserByEmail,
  freeDeletedUserEmail,
  findUserByGoogleId,
  createEmailUser,
  createGoogleUser,
  getUserById,
  createFarmerRecord,
  linkGoogleToUser,
  setUserPassword,
  savePasswordResetToken,
  findUserByResetToken,
  clearResetToken,
} from './auth.query.js';
import { sendSetPasswordEmail } from '../../utils/email.js';

export async function register(firstName, phone, email, password, role) {
  const existing = await findUserByEmail(email);
  if (existing) {
    const error = new Error('Email already registered');
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Free up the email if a soft-deleted user holds it
  await freeDeletedUserEmail(email);

  const userId = await createEmailUser(firstName, phone, email, hashedPassword, role);
  if (role === 'farmer') {
    await createFarmerRecord(userId);
  }

  const token = jwt.sign(
    { id: userId, role, email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  return { token, user: { id: userId, firstName, email, role } };
}

export async function loginWithEmail(email, password) {
  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }

  // Google-only user has no password — prompt them to set one
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

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  return {
    token,
    user: { id: user.id, firstName: user.first_name, email: user.email, role: user.role },
  };
}

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
      // Email user exists — link Google account to it
      await linkGoogleToUser(existingEmail.id, payload.sub);
      user = await getUserById(existingEmail.id);
    } else {
      // Free up the email if a soft-deleted user holds it
      await freeDeletedUserEmail(payload.email);

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

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  return {
    token,
    user: { id: user.id, firstName: user.first_name, email: user.email, role: user.role },
  };
}

export async function requestSetPassword(email) {
  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  if (user.password) {
    const error = new Error('Password is already set. Use login instead.');
    error.status = 400;
    throw error;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await savePasswordResetToken(user.id, token, expires);
  await sendSetPasswordEmail(email, token);
}

export async function setPassword(token, newPassword) {
  const user = await findUserByResetToken(token);
  if (!user) {
    const error = new Error('Invalid or expired token');
    error.status = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await setUserPassword(user.id, hashedPassword);
  await clearResetToken(user.id);
}

export async function getMe(userId) {
  const user = await getUserById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }
  return user;
}
