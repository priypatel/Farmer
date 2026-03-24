import { errorResponse } from '../utils/response.js';

export function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const messages = error.details.map((d) => d.message).join(', ');
      return errorResponse(res, messages, 400);
    }

    next();
  };
}
