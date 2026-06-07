import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { env, isDevelopment } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

/**
 * Build and configure the Express application.
 * Kept separate from server.js so the app can be imported for testing.
 */
export function createApp() {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS — allow the frontend origin and send credentials (cookies for Phase 2 auth)
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );

  // Body + cookie parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Request logging (concise in dev)
  if (isDevelopment) {
    app.use(morgan('dev'));
  }

  // Friendly root response
  app.get('/', (req, res) => {
    res.json({
      name: 'AI LMS API',
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
