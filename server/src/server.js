import cron from 'node-cron';
import { createApp } from './app.js';
import { env, checkEnv } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocket } from './sockets/index.js';
import { checkAndSendReminders } from './services/email.service.js';

async function start() {
  checkEnv();

  // Attempt DB connection (non-fatal in Phase 1 so /api/health always works).
  await connectDB();

  const app = createApp();

  const server = app.listen(env.port, () => {
    console.log('');
    console.log('🚀 AI LMS API is running');
    console.log(`   ➜  Local:   http://localhost:${env.port}`);
    console.log(`   ➜  Health:  http://localhost:${env.port}/api/health`);
    console.log(`   ➜  Env:     ${env.nodeEnv}`);
    console.log(`   ➜  CORS:    ${env.clientUrl}`);
    console.log('');
  });

  // Real-time layer (Phase 7): forum live updates + notifications.
  initSocket(server);

  // Daily assignment due-date reminder emails (Phase 9). 9:00 AM server time.
  cron.schedule('0 9 * * *', () => {
    checkAndSendReminders()
      .then((n) => n && console.log(`📧 Sent ${n} assignment reminder(s).`))
      .catch((e) => console.error('Reminder job failed:', e.message));
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB().catch(() => {});
      process.exit(0);
    });
    // Force-exit if it hangs
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
  });
}

start().catch((err) => {
  console.error('❌ Fatal startup error:', err);
  process.exit(1);
});
