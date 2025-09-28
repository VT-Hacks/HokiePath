import { env } from './env';
import { developmentConfig } from './development';
import { productionConfig } from './production';

const configs = {
  development: developmentConfig,
  production: productionConfig,
};

export const config =
  configs[env.NODE_ENV as 'development' | 'production'] ?? developmentConfig;
