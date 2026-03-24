/**
 * Send a success JSON response.
 */
export function successResponse(res, data, message = 'Success', status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send an error JSON response.
 */
export function errorResponse(res, message = 'Error', status = 500) {
  return res.status(status).json({
    success: false,
    message,
  });
}
