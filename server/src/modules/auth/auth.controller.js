import { successResponse } from '../../utils/response.js';
import * as authService from './auth.service.js';

export async function register(req, res, next) {
  try {
    const { firstName, phone, email, password, role } = req.body;
    const result = await authService.register(firstName, phone, email, password, role);
    return successResponse(res, result, 'Registration successful', 201);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginWithEmail(email, password);
    return successResponse(res, result, 'Login successful');
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
    const result = await authService.loginWithGoogle(credential);
    return successResponse(res, result, 'Google authentication successful');
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

export async function setPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    await authService.setPassword(token, password);
    return successResponse(res, null, 'Password set successfully. You can now login with email and password.');
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
