const mongoose = require('mongoose');

// Set env vars BEFORE any modules are required by tests
process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

let mongoServer;

const { MongoMemoryServer } = require('mongodb-memory-server');

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    // Ensure we are not using the real DB
    process.env.MONGODB_URI = uri;

    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
});
