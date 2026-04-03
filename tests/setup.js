// Set env vars BEFORE any modules are required by tests
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'; // Placeholder, will be overwritten by memory server
process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';

// Global mock for appConfig to prevent DB calls during tests
jest.mock('../src/core/Lib/appConfig.js', () => ({
    getAppConfig: jest.fn(() => Promise.resolve({
        smtp: {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            user: process.env.SMTP_EMAIL || '',
            pass: process.env.SMTP_PASSWORD || '',
            from_address: process.env.SMTP_FROM_ADDRESS || '',
            from_name: process.env.SMTP_FROM_NAME || 'PahadiGo'
        },
        msg91: {
            auth_key: process.env.MSG91_AUTH_KEY || '',
            template_id: process.env.MSG91_TEMPLATE_ID || ''
        },
        push_notification: {
            server_key: process.env.PUSH_NOTIFICATION_SERVER_KEY || ''
        },
        razorpay: {
            key_id: process.env.RAZORPAY_KEY_ID || '',
            key_secret: process.env.RAZORPAY_KEY_SECRET || ''
        },
        jwt_secret: process.env.JWT_SECRET || 'test_secret',
        mongodb_uri: process.env.MONGODB_URI,
        api_url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
        debug_mode: process.env.DEBUG === 'true',
        google: { 
            client_id: process.env.GOOGLE_CLIENT_ID, 
            client_secret: process.env.GOOGLE_CLIENT_SECRET 
        },
        facebook: { 
            app_id: process.env.FACEBOOK_APP_ID, 
            app_secret: process.env.FACEBOOK_APP_SECRET 
        },
        apple: { 
            client_id: process.env.APPLE_CLIENT_ID, 
            team_id: process.env.APPLE_TEAM_ID, 
            key_id: process.env.APPLE_KEY_ID, 
            private_key: process.env.APPLE_PRIVATE_KEY 
        },
        app: { 
            name: process.env.APP_NAME || 'PahadiGo', 
            terms_conditions: process.env.TERMS_CONDITIONS || '', 
            privacy_policy: process.env.PRIVACY_POLICY || '' 
        },
        cloudinary: { url: process.env.CLOUDINARY_URL || '' },
        secrets: {
            social_pass: process.env.SOCIAL_PASS || '',
            other_account_pass: process.env.OTHER_ACCOUNT_PASS || '',
            master_otp: process.env.MASTER_OTP || '888888'
        }
    })),
    clearAppConfigCache: jest.fn()
}));

// Removed jest.setTimeout, relying on proper teardown instead.

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    // Ensure we are not using the real DB
    process.env.MONGODB_URI = uri;

    await mongoose.connect(uri);
});

afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
});

afterEach(async () => {
    if (mongoose.connection.readyState !== 0) {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            await collection.deleteMany();
        }
    }
});
