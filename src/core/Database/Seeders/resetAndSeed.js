import mongoose from 'mongoose';
import { seedCategories } from './categorySeeder.js';
import { seedCategoryDocuments } from './CategoryDocumentSeeder.js';
import { seedUsers } from './userSeeder.js';
import { seedSettings } from './SettingSeeder.js';
import { seedLocations } from './locationSeeder.js';
import { seedPolicies } from './policySeeder.js';
import { seedPackages } from './PackageSeeder.js';
import { loadEnv } from '../../Helpers/env.js';
import connectDB from '../../Config/db.js';

const resetAndSeed = async () => {
    try {
        loadEnv();
        await connectDB();
        if (mongoose.connection.db) {
            await mongoose.connection.db.dropDatabase();
        }
        await seedCategories();
        await seedCategoryDocuments();
        await seedUsers();
        await seedSettings();
        await seedLocations();
        await seedPolicies();
        await seedPackages();
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

if (process.env.NODE_ENV !== 'test') {
    resetAndSeed();
}

export default resetAndSeed;
