import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached: { conn: mongoose.Mongoose | null; promise: Promise<mongoose.Mongoose> | null } = (global as any).mongoose || {
  conn: null,
  promise: null,
};

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: 'Linkedpilot', // Updated to match Atlas
      bufferCommands: false,
    }).then((mongoose) => {
      console.log('Connected to MongoDB Atlas');
      return mongoose;
    }).catch((error) => {
      console.error('MongoDB connection error:', error);
      throw error;
    });
  }

  cached.conn = await cached.promise;
  (global as any).mongoose = cached;
  return cached.conn;
}

export { connectToDatabase };