import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../../../.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            envContent.split('\n').forEach(line => {
                const [key, ...value] = line.split('=');
                if (key && value) {
                    process.env[key.trim()] = value.join('=').trim().replace(/^['"]|['"]$/g, '');
                }
            });
        }
    } catch (e) {}
}

loadEnv();

import dbConnect from '../Config/db.js';

async function debug() {
    await dbConnect();
    const db = mongoose.connection.db;
    
    console.log("--- Collection Check ---");
    const collections = await db.listCollections().toArray();
    console.log("Collections in DB:", collections.map(c => c.name).join(', '));

    console.log("\n--- VendorDocument Records ---");
    const docs = await db.collection('vendordocuments').find({}).limit(5).toArray();
    if (docs.length === 0) {
        console.log("No records found in vendordocuments collection.");
    } else {
        docs.forEach(d => {
            console.log("Record:", JSON.stringify(d, null, 2));
        });
    }

    console.log("\n--- Category Summary ---");
    const summary = await db.collection('vendordocuments').aggregate([
        { $group: { _id: "$category_slug", count: { $sum: 1 }, statuses: { $addToSet: "$status" } } }
    ]).toArray();
    console.log(JSON.stringify(summary, null, 2));

    process.exit(0);
}

debug();
