import { MongoClient } from 'mongodb';

const uri = "mongodb://skywalkerlknw_db_user:Zf413Ft9BVgYReQz@ac-g0g4ohr-shard-00-00.clydegc.mongodb.net:27017,ac-g0g4ohr-shard-00-01.clydegc.mongodb.net:27017,ac-g0g4ohr-shard-00-02.clydegc.mongodb.net:27017/pahadigo_db?ssl=true&replicaSet=atlas-c0vsyl-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";
const dbName = "pahadigo_db";

async function main() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log("Connected to MongoDB.");
        const db = client.db(dbName);
        await db.collection("packages").deleteMany({});
        console.log("Successfully wiped all old packages.");
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

main().catch(console.error);
