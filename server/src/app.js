import express from 'express';
import cors from 'cors';
import requestLogger from './middlewares/requestLogger.js';
import errorHandler from './middlewares/errorHandler.js';
import { successResponse } from './utils/response.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  successResponse(res, { status: 'ok' }, 'Server is running');
});

// TODO: Mount route modules here as they are built
// app.use('/api/auth', authRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
