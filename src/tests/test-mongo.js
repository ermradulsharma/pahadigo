const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
    try {
        console.log("Starting MongoMemoryServer...");
        const mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        console.log("URI:", uri);
        console.log("Connecting mongoose...");
        await mongoose.connect(uri);
        console.log("Connected!");
        await mongoose.disconnect();
        await mongoServer.stop();
        console.log("Done");
    } catch (e) {
        console.error("Error:", e);
    }
})();
