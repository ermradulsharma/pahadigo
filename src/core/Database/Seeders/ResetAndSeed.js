import mongoose from 'mongoose';

import { loadEnv } from '../../Helpers/env.js';
import connectDB from '../../Config/db.js';

const resetAndSeed = async () => {
    try {
        loadEnv();
        await connectDB();
        if (mongoose.connection.db) {
            const collections = await mongoose.connection.db.collections();
            for (const collection of collections) {
                try {
                    await collection.deleteMany({});
                } catch (err) {
                    console.warn(`Could not clear collection ${collection.collectionName}:`, err.message);
                }
            }
        }
        const { seedCategories } = await import('./CategorySeeder.js');
        const { seedCategoryDocuments } = await import('./CategoryDocumentSeeder.js');
        const { seedUsers } = await import('./UserSeeder.js');
        const { seedSettings } = await import('./SettingSeeder.js');
        const { seedLocations } = await import('./LocationSeeder.js');
        const { seedPolicies } = await import('./PolicySeeder.js');

        await seedCategories();
        await seedCategoryDocuments();
        await seedUsers();
        await seedSettings();
        await seedLocations();
        await seedPolicies();
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
};

if (process.env.NODE_ENV !== 'test') await resetAndSeed();
export default resetAndSeed;
