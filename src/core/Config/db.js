import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.warn("MONGODB_URI is not defined. Database connection will likely fail.");
}
let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}
async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }
    if (!cached.promise) {
        if (!MONGODB_URI) {
            // Check if we are in the Next.js build phase
            if (process.env.NEXT_PHASE === 'phase-production-build') {
                console.warn("⚠️ MONGODB_URI is missing. Skipping database connection ONLY for build phase.");
                return null;
            }
            throw new Error("MONGODB_URI is not defined. Please check your environment variables.");
        }
        const opts = {
            bufferCommands: false,
        };
        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
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
