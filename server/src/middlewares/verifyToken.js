import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { errorResponse } from '../utils/response.js';

export function verifyToken(req, res, next) {
  const token = req.cookies?.access_token;

  if (!token) {
    return errorResponse(res, 'Access denied. Please log in.', 401);
  }

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    req.user = decoded;
    next();
  } catch {
    return errorResponse(res, 'Invalid or expired token', 401);
  }
}
