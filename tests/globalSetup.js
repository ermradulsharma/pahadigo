import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function () {
    const mongoServer = await MongoMemoryServer.create({
        instance: {
            launchTimeout: 240000
        },
        binary: {
            skipMD5: true
        }
    });
    process.env.GLOBAL_MONGO_URI = mongoServer.getUri();
    globalThis.__MONGOINSTANCE = mongoServer;
}
