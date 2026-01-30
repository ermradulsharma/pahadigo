import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { seedCategories } from './categorySeeder.js';
import { seedCategoryDocuments } from './CategoryDocumentSeeder.js';
import { seedUsers } from './userSeeder.js';
import { seedSettings } from './SettingSeeder.js';
import { seedLocations } from './locationSeeder.js';
import { seedPolicies } from './policySeeder.js';

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
    }
};

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/travels_db';
        const conn = await mongoose.connect(uri, {
        });
    } catch (error) {
        process.exit(1);
    }
};

const resetAndSeed = async () => {
    loadEnv();
    await connectDB();

    if (mongoose.connection.db) {
        await mongoose.connection.db.dropDatabase();
    } else {
    }

    const results = await seedCategories();

    const docResults = await seedCategoryDocuments();

    const userResults = await seedUsers();

    const settingResults = await seedSettings();

    const locationResults = await seedLocations();

    const policyResults = await seedPolicies();

    process.exit(0);
};

resetAndSeed();
