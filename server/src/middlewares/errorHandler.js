import logger from '../utils/logger.js';
import { errorResponse } from '../utils/response.js';

function errorHandler(err, req, res, next) {
  logger.error(err.message, {
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
  });

  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error'
      : err.message;

  return errorResponse(res, message, status);
}

export default errorHandler;
