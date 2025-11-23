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
    cached.promise = mongoose
      .connect(MONGODB_URI!, {
        dbName: 'Linkedpilot',
        bufferCommands: false,
      })
      .then((mongoose) => {
        console.log('✅ Mongoose: Connected to MongoDB Atlas');
        return mongoose;
      })
      .catch((error) => {
        console.error('❌ Mongoose: Connection error:', error);
        throw error;
      });
  }

  cached.conn = await cached.promise;
  globalMongoose.mongoose = cached;
  return cached.conn;
}

export { connectToDatabase };