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

if (process.env.NODE_ENV !== 'test') {
  resetAndSeed();
}

export default resetAndSeed;
