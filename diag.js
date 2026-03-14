import AuthService from '../src/core/Services/AuthService.js';
import OTPService from '../src/core/Services/OTPService.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

async function run() {
    process.env.JWT_SECRET = 'test_secret';
    process.env.NODE_ENV = 'test';
    
    const mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    try {
        console.log('Testing verifyAndLogin with invalid OTP...');
        await AuthService.verifyAndLogin({
            identifier: 'test@example.com',
            otp: '123456',
            email: 'test@example.com'
        });
    } catch (err) {
        console.log('Caught expected error (or unexpected):', err.message);
        console.log(err.stack);
    } finally {
        await mongoose.disconnect();
        await mongoServer.stop();
        process.exit(0);
    }
}

run();
