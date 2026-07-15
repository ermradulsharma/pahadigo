import mongoose from 'mongoose';

import { loadEnv } from '../../Helpers/env.js';
import connectDB from '../../Config/db.js';

const resetAndSeed = async () => {
    console.log("Starting ResetAndSeed script...");
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

        console.log("Seeding Categories...");
        await seedCategories();
        console.log("Seeding Category Documents...");
        await seedCategoryDocuments();
        console.log("Seeding Users...");
        await seedUsers();
        console.log("Seeding Settings...");
        await seedSettings();
        console.log("Seeding Locations...");
        await seedLocations();
        console.log("Seeding Policies...");
        await seedPolicies();
        console.log("Seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Seeder Error:", error);
        process.exit(1);
    }
};

console.log(`Current NODE_ENV is: ${process.env.NODE_ENV}`);
if (process.env.NODE_ENV !== 'test') {
    console.log("Not in test mode, proceeding to resetAndSeed()...");
    await resetAndSeed();
} else {
    console.log("In test mode, skipping resetAndSeed().");
}

export default resetAndSeed;
