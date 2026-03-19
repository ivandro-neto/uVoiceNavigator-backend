import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiVersion: process.env.API_VERSION || 'v1',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  logLevel: process.env.LOG_LEVEL || 'debug',
  logDir: process.env.LOG_DIR || 'logs',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  cacheTtl: parseInt(process.env.CACHE_TTL, 10) || 3600,
  dashboardCacheTtl: parseInt(process.env.DASHBOARD_CACHE_TTL, 10) || 300,
}));
