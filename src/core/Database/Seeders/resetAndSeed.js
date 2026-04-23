import mongoose from 'mongoose';
import { seedCategories } from '@/core/Seeders/CategorySeeder.js';
import { seedCategoryDocuments } from '@/core/Seeders/CategoryDocumentSeeder.js';
import { seedUsers } from '@/core/Seeders/UserSeeder.js';
import { seedSettings } from '@/core/Seeders/SettingSeeder.js';
import { seedLocations } from '@/core/Seeders/LocationSeeder.js';
import { seedPolicies } from '@/core/Seeders/PolicySeeder.js';
import { loadEnv } from '@/core/Helpers/env.js';
import connectDB from '@/core/Config/db.js';

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
