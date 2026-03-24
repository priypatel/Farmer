import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import requestLogger from './middlewares/requestLogger.js';
import errorHandler from './middlewares/errorHandler.js';
import { successResponse } from './utils/response.js';
import config from './config/env.js';

const app = express();

// Middlewares
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);
//

// Health check
app.get('/health', (req, res) => {
  successResponse(res, { status: 'ok' }, 'Server is running');
});

// Route modules
import authRoutes from './modules/auth/auth.routes.js';
app.use('/auth', authRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
