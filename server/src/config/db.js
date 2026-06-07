import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

let retryTimer = null;
let listenersBound = false;

/**
 * Connect to MongoDB via Mongoose.
 *
 * Non-fatal + self-healing: if MongoDB is unreachable at startup, the API still
 * boots and the connection is retried in the background every few seconds until
 * it succeeds. Once connected, the driver auto-reconnects on later blips. This
 * prevents the "buffering timed out" dead-connection state when Atlas is briefly
 * unreachable (e.g. an IP-allowlist change) at boot.
 *
 * @returns {Promise<boolean>} true if connected on the first attempt.
 */
export async function connectDB() {
  if (!env.mongoUri) {
    console.warn('⚠️  Skipping MongoDB connection — MONGO_URI is empty.');
    return false;
  }

  if (!listenersBound) {
    listenersBound = true;
    mongoose.connection.on('error', (err) =>
      console.error('❌ MongoDB connection error:', err.message)
    );
    mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected.'));
    mongoose.connection.on('reconnected', () => console.log('✅ MongoDB reconnected.'));
  }

  const attempt = async () => {
    // Skip if already connected/connecting.
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
      return true;
    }
    try {
      const conn = await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 });
      console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      return true;
    } catch (err) {
      console.error('❌ MongoDB connection failed:', err.message.split('.')[0] + '.');
      console.error('   Retrying in 5s… (API stays up; DB routes work once connected.)');
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(attempt, 5000);
      return false;
    }
  };

  return attempt();
}

export async function disconnectDB() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  await mongoose.connection.close();
  console.log('🔌 MongoDB connection closed.');
}

export default connectDB;
