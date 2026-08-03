// Set env vars BEFORE any modules are required by tests
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'; // Placeholder, will be overwritten by memory server
process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

import mongoose from 'mongoose';
import { jest } from '@jest/globals';

// Increase timeout for global hooks (especially for slow teardowns on CI/large runs)
jest.setTimeout(300000);

beforeAll(async () => {
  const uri = process.env.GLOBAL_MONGO_URI;

  if (!uri) {
      console.warn('GLOBAL_MONGO_URI is not set. Ensure globalSetup is configured.');
      return;
  }

  // Ensure we are not using the real DB
  process.env.MONGODB_URI = uri;

  if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  await mongoose.disconnect();
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
    'Internal Error',
    'Seeding failed:',
    'Error seeding locations:',
    'Drop Failed',
    'Crashed'
  ];
  const combinedMsg = args.map(arg => String(arg)).join(' ');
  if (noise.some(n => combinedMsg.includes(n))) return;
  originalError(...args);
};

console.log = (...args) => {
  const noise = [
    'successfully',
    'Successfully',
    '[NotificationService]',
    'Location Seeder Completed'
  ];
  const combinedMsg = args.map(arg => String(arg)).join(' ');
  if (noise.some(n => combinedMsg.includes(n))) return;
  originalLog(...args);
};
