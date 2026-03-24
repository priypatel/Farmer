import config from '../../config/env.js';
import { successResponse } from '../../utils/response.js';
import * as authService from './auth.service.js';

const isProduction = config.nodeEnv === 'production';

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/auth/refresh',
  });
}

function clearAuthCookies(res) {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token', { path: '/auth/refresh' });
}

export async function register(req, res, next) {
  try {
    const { firstName, phone, email, password, role } = req.body;
    const { user, accessToken, refreshToken } = await authService.register(firstName, phone, email, password, role);
    setAuthCookies(res, accessToken, refreshToken);
    return successResponse(res, { user }, 'Registration successful', 201);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.loginWithEmail(email, password);
    setAuthCookies(res, accessToken, refreshToken);
    return successResponse(res, { user }, 'Login successful');
  } catch (error) {
    if (error.code === 'PASSWORD_NOT_SET') {
      return res.status(403).json({
        success: false,
        message: error.message,
        code: 'PASSWORD_NOT_SET',
      });
    }
    next(error);
  }
}

export async function googleAuth(req, res, next) {
  try {
    const { credential } = req.body;
    const { user, accessToken, refreshToken } = await authService.loginWithGoogle(credential);
    setAuthCookies(res, accessToken, refreshToken);
    return successResponse(res, { user }, 'Google authentication successful');
  } catch (error) {
    next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }
    const { user, accessToken, refreshToken } = await authService.refreshAccessToken(token);
    setAuthCookies(res, accessToken, refreshToken);
    return successResponse(res, { user }, 'Token refreshed');
  } catch (error) {
    clearAuthCookies(res);
    next(error);
  }
}

export async function logoutHandler(req, res, next) {
  try {
    await authService.logout(req.user?.id);
    clearAuthCookies(res);
    return successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    return successResponse(res, null, 'If that email exists, a reset link has been sent');
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    return successResponse(res, null, 'Password updated successfully. You can now log in.');
  } catch (error) {
    next(error);
  }
}

export async function setPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    return successResponse(res, null, 'Password set successfully. You can now login with email and password.');
  } catch (error) {
    next(error);
  }
}

export async function requestSetPassword(req, res, next) {
  try {
    const { email } = req.body;
    await authService.requestSetPassword(email);
    return successResponse(res, null, 'Password set link sent to your email');
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    return successResponse(res, user, 'User retrieved');
  } catch (error) {
    next(error);
  }
}
