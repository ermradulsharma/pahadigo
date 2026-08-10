import { MongoMemoryReplSet } from 'mongodb-memory-server';

export default async function () {
    const mongoServer = await MongoMemoryReplSet.create({
        replSet: { count: 1 },
        instanceOpts: [
            {
                port: 27017,
            }
        ],
        binary: {
            skipMD5: true
        }
    });
    process.env.GLOBAL_MONGO_URI = mongoServer.getUri();
    globalThis.__MONGOINSTANCE = mongoServer;
}
