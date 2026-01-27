import mongoose, { Mongoose } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Define a type for the global cached object for better TypeScript support
interface CachedMongoose {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// Access the global object for caching (prevents multiple connections in dev mode)
const globalMongoose = global as unknown as { mongoose: CachedMongoose };

let cached: CachedMongoose = globalMongoose.mongoose || { conn: null, promise: null };

/**
 * Global utility function to connect to the database.
 * Ensures connection caching and readiness.
 */
async function connectToDatabase(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      dbName: 'Linkedpilot',
      bufferCommands: false,
      family: 4, // Force IPv4 to avoid potential IPv6/DNS issues
    };

    console.log('🔌 Mongoose: Connecting to MongoDB...');

    cached.promise = mongoose
      .connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        console.log('✅ Mongoose: Connected to MongoDB Atlas');
        return mongoose;
      })
      .catch((error) => {
        console.error('❌ Mongoose: Connection error:', error);
        // Do not throw here immediately if we want to allow retries, 
        // but for now, caching the rejection is correct so we don't spam.
        // However, we might want to clear the promise on failure so next request retries.
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Reset promise on failure to allow retry
    throw e;
  }

  globalMongoose.mongoose = cached;
  return cached.conn;
}

export { connectToDatabase };