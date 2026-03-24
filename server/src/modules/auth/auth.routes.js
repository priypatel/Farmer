import { Router } from 'express';
import {
  register, login, googleAuth,
  refresh, logoutHandler,
  forgotPassword, resetPassword,
  setPassword, requestSetPassword, getMe,
} from './auth.controller.js';
import { validate } from '../../middlewares/validate.js';
import { verifyToken } from '../../middlewares/verifyToken.js';
import {
  registerSchema, loginSchema, googleSchema,
  requestSetPasswordSchema, setPasswordSchema, forgotPasswordSchema, resetPasswordSchema,
} from './auth.validation.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/google', validate(googleSchema), googleAuth);
router.post('/refresh', refresh);
router.post('/logout', verifyToken, logoutHandler);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/set-password', validate(setPasswordSchema), setPassword);
router.post('/request-set-password', validate(requestSetPasswordSchema), requestSetPassword);
router.get('/me', verifyToken, getMe);

export default router;
