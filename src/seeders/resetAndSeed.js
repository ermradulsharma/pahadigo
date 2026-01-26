
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { seedCategories } from './categorySeeder.js';
import { seedServiceDocuments } from './ServiceDocumentSeeder.js';

// Simple .env parser since we can't assume dotenv is installed/loadable in standalone script context easily without args
const loadEnv = () => {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            envConfig.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    process.env[key.trim()] = value.trim();
                }
            });
        }
    } catch (e) {
        console.error('Error loading .env', e);
    }
};

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/travels_db';
        const conn = await mongoose.connect(uri, {
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const resetAndSeed = async () => {
    loadEnv();
    await connectDB();

    console.log('Clearing database...');
    if (mongoose.connection.db) {
        await mongoose.connection.db.dropDatabase();
        console.log('Database cleared.');
    } else {
        console.error('Database connection invalid, cannot drop.');
    }

    console.log('Running Seeders...');
    const results = await seedCategories();
    console.log('Category Seed Result:', JSON.stringify(results, null, 2));

    const docResults = await seedServiceDocuments();
    console.log('Service Document Seed Result:', JSON.stringify(docResults, null, 2));

    console.log('Process complete.');
    process.exit(0);
};

resetAndSeed();
