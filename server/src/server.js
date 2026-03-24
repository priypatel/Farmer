import app from './app.js';
import config from './config/env.js';
import logger from './utils/logger.js';
import pool from './database/pool.js';
import { runMigrations } from './database/migrate.js';

let server;

async function start() {
  try {
    await runMigrations();
    logger.info('Migrations complete');

    server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

function shutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      await pool.end();
      logger.info('Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();
