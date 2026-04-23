import mongoose from 'mongoose';


let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}
async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    const uri = process.env.MONGODB_URI || (process.env.NODE_ENV === 'test' ? 'mongodb://localhost:27017/test_dummy' : null);
    if (!uri) {
      // Check if we are in the Next.js build phase
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        return null;
      }
      throw new Error("MONGODB_URI is not defined. Please check your environment variables.");
    }
    const opts = {
      bufferCommands: false,
    };
    cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
      return mongoose;
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

export default connectDB;
