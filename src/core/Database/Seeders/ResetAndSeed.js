import mongoose from 'mongoose';
import { seedCategories } from './CategorySeeder.js';
import { seedCategoryDocuments } from './CategoryDocumentSeeder.js';
import { seedUsers } from './UserSeeder.js';
import { seedSettings } from './SettingSeeder.js';
import { seedLocations } from './LocationSeeder.js';
import { seedPolicies } from './PolicySeeder.js';
import { loadEnv } from '../../Helpers/env.js';
import connectDB from '../../Config/db.js';

const resetAndSeed = async () => {
  try {
    loadEnv();
    await connectDB();
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    console.log("Starting Seeding Process...");
    await seedCategories();
    console.log("Categories Seeded");
    await seedCategoryDocuments();
    console.log("Category Documents Seeded");
    await seedUsers();
    console.log("Users Seeded");
    await seedSettings();
    console.log("Settings Seeded");
    await seedLocations();
    console.log("Locations Seeded");
    await seedPolicies();
    console.log("Policies Seeded");
    console.log("Seeding Completed Successfully");
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
