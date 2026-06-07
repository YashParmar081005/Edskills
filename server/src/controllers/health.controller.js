import mongoose from 'mongoose';

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

/**
 * GET /api/health
 * Lightweight liveness/readiness probe. Always returns { status: "ok" }
 * plus diagnostic info (uptime, db state) useful for the frontend + ops.
 */
export function getHealth(req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'ai-lms-api',
    timestamp: new Date().toISOString(),
    uptime: Number(process.uptime().toFixed(2)),
    db: DB_STATES[mongoose.connection.readyState] || 'unknown',
  });
}

export default getHealth;
