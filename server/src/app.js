import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

import { env, isDevelopment } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';

/**
 * Build and configure the Express application.
 * Kept separate from server.js so the app can be imported for testing.
 */
export function createApp() {
  const app = express();

  // Trust the first proxy hop (Vite dev proxy / hosting load balancer) so
  // req.ip is correct for rate limiting.
  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet());

  // CORS — allow the frontend origin and send credentials (cookies for Phase 2 auth)
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );

  // Stripe webhook needs the RAW body for signature verification — this must
  // run before express.json() (which would otherwise consume/parse the body).
  app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

  // Body + cookie parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Strip MongoDB operators ($, .) from inputs (NoSQL-injection protection)
  // and guard against HTTP parameter pollution.
  app.use(mongoSanitize());
  app.use(hpp());

  // Backstop rate limit on the whole API.
  app.use('/api', apiLimiter);

  // Request logging (concise in dev)
  if (isDevelopment) {
    app.use(morgan('dev'));
  }

  // Friendly root response
  app.get('/', (req, res) => {
    res.json({
      name: 'EdSkill.ai API',
      status: 'running',
      health: '/api/health',
    });
  });

  // Feature routes
  app.use('/api', apiRoutes);

  // 404 + centralized error handling (must come last)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
