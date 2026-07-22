import mongoose from 'mongoose';
import { RESPONSE_MESSAGES } from '../Constants/index.js';

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };
async function connectDB() {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error(RESPONSE_MESSAGES.ERROR.GENERIC);
        const opts = { bufferCommands: false };
        cached.promise = mongoose.connect(uri, opts).then((mongoose) => mongoose);
    }
    try { 
        cached.conn = await cached.promise; 
        
        // Initialize Background Workers if not in test env
        if (process.env.NODE_ENV !== 'test') {
            import('../Lib/Queue/Workers/NotificationWorker.js')
                .then(module => module.initNotificationWorker().catch(console.error))
                .catch(console.error);
        }
    } catch (e) { 
        cached.promise = null; 
        throw e; 
    }
    return cached.conn;
}

export default connectDB;
