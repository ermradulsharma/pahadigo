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
            envConfig.split(/\r?\n/).forEach(line => {
                const index = line.indexOf('=');
                if (index > 0) {
                    const key = line.substring(0, index).trim();
                    const value = line.substring(index + 1).trim();
                    if (key && value) {
                        process.env[key] = value;
                    }
                }
            });
        }
    } catch (e) {
    }
};

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/travels_db';
        console.log(`Connecting to: ${uri}`);
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Connection Error: ${error.message}`);
        process.exit(1);
    }
};

const resetAndSeed = async () => {
    try {
        loadEnv();
        await connectDB();

        if (mongoose.connection.db) {
            console.log("Dropping database...");
            await mongoose.connection.db.dropDatabase();
        }

        console.log("Seeding categories...");
        const results = await seedCategories();
        console.log("Categories seeded:", results);

        console.log("Seeding category documents...");
        await seedCategoryDocuments();
        console.log("Category documents seeded.");

        console.log("Seeding users...");
        const userResults = await seedUsers();
        console.log("Users seeded:", userResults);

        console.log("Seeding settings...");
        await seedSettings();
        console.log("Settings seeded.");

        console.log("Seeding locations...");
        await seedLocations();
        console.log("Locations seeded.");

        console.log("Seeding policies...");
        await seedPolicies();
        console.log("Policies seeded.");

        console.log("All seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Seeding Error:", error);
        process.exit(1);
    }
};

resetAndSeed();
