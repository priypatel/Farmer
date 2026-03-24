import app from './app.js';
import config from './config/env.js';
import logger from './utils/logger.js';
import { runMigrations } from './database/migrate.js';

async function start() {
  try {
    await runMigrations();
    logger.info('Migrations complete');

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

start();
