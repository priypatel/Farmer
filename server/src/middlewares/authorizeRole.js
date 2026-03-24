import { errorResponse } from '../utils/response.js';

export function authorizeRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return errorResponse(res, 'Forbidden. Insufficient permissions.', 403);
    }
    next();
  };
}
