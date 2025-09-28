import app from './app';
import { logger } from './common/logger';
import { config } from './config';

(async () => {
  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`);
  });
})();
