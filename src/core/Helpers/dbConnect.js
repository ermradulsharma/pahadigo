import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pahadigo_db';
        await mongoose.connect(uri);
    } catch (error) {
        process.exit(1);
    }
};
