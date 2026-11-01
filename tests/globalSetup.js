import path from 'node:path';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

export default async function () {
    const downloadDir = path.resolve(process.cwd(), '.cache', 'mongodb-binaries');
    process.env.MONGOMS_DOWNLOAD_DIR = downloadDir;

    const mongoServer = await MongoMemoryReplSet.create({
        replSet: { count: 1 },
        binary: {
            downloadDir,
            skipMD5: true
        }
    });
    process.env.GLOBAL_MONGO_URI = mongoServer.getUri();
    globalThis.__MONGOINSTANCE = mongoServer;
}
