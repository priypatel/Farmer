import { Router } from 'express';
import { register, login, googleAuth, requestSetPassword, setPassword, getMe } from './auth.controller.js';
import { validate } from '../../middlewares/validate.js';
import { verifyToken } from '../../middlewares/verifyToken.js';
import { registerSchema, loginSchema, googleSchema, requestSetPasswordSchema, setPasswordSchema } from './auth.validation.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/google', validate(googleSchema), googleAuth);
router.post('/request-set-password', validate(requestSetPasswordSchema), requestSetPassword);
router.post('/set-password', validate(setPasswordSchema), setPassword);
router.get('/me', verifyToken, getMe);

export default router;
