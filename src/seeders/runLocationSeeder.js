import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { seedLocations } from './locationSeeder.js';

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
        loadEnv();
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/travels_db';
        console.log('Connecting to DB...');
        await mongoose.connect(uri, {});
        console.log('Connected to DB');
    } catch (error) {
        console.error('DB Connection Failed', error);
        process.exit(1);
    }
};

const run = async () => {
    await connectDB();

    // We do NOT drop the database here as we might want to just append/update locations
    // But locationSeeder handles upserts nicely.

    console.log('Starting Location Seeder...');
    const result = await seedLocations();

    if (result) {
        console.log('Location Seeder Completed Successfully');
    } else {
        console.log('Location Seeder Failed');
    }

    process.exit(0);
};

run();
