import mongoose from 'mongoose';
import { env } from './env.js';

// Surface clear, actionable Mongoose deprecation behavior.
mongoose.set('strictQuery', true);

/**
 * Connect to MongoDB via Mongoose.
 *
 * Connection is intentionally non-fatal: if MongoDB is unavailable the API
 * still boots so the Phase 1 /api/health demo works. Later phases that depend
 * on the database will surface their own errors per-request.
 *
 * @returns {Promise<boolean>} true if connected, false otherwise.
 */
export async function connectDB() {
  if (!env.mongoUri) {
    console.warn('⚠️  Skipping MongoDB connection — MONGO_URI is empty.');
    return false;
  }

  try {
    const conn = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected.');
    });

    return true;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error(
      '   The API will keep running, but database-backed routes will fail until MongoDB is reachable.'
    );
    return false;
  }
}

export async function disconnectDB() {
  await mongoose.connection.close();
  console.log('🔌 MongoDB connection closed.');
}

export default connectDB;
