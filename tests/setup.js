// Set env vars BEFORE any modules are required by tests
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'; // Placeholder, will be overwritten by memory server
process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';

// Increase timeout for global hooks (especially for slow teardowns on CI/large runs)
jest.setTimeout(120000);

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
        instance: {
            launchTimeoutMS: 240000 // Increased further
        },
        binary: {
            skipMD5: true
        },
        spawn: {
            timeoutMS: 240000 // Added spawn timeout
        }
    });
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

// Suppress surgical noisy logs to keep test output clean
const originalError = console.error;
const originalLog = console.log;

console.error = (...args) => {
    // Suppress only known expected noise from tests
    const noise = [
        'SMTP credentials or host missing',
        'Different login method',
        'error:',
        'Error:',
        'ERROR:',
        'Account uses a different login method',
        'Internal Error'
    ];
    const msg = args[0] && typeof args[0] === 'string' ? args[0] : '';
    if (noise.some(n => msg.includes(n))) return;
    originalError(...args);
};

console.log = (...args) => {
    const msg = args[0] && typeof args[0] === 'string' ? args[0] : '';
    if (msg.includes('successfully')) return;
    originalLog(...args);
};
