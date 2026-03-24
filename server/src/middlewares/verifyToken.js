import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { errorResponse } from '../utils/response.js';

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Access denied. No token provided.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch {
    return errorResponse(res, 'Invalid or expired token', 401);
  }
}
