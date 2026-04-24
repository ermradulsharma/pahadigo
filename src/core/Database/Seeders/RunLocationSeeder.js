import mongoose from 'mongoose';
import { seedLocations } from './LocationSeeder.js';
import { loadEnv } from '../../Helpers/env.js';
import connectDB from '../../Config/db.js';

const run = async () => {
  try {
    loadEnv();
    await connectDB();
    const result = await seedLocations();
    if (result) {
      console.log('Location Seeder Completed Successfully');
    } else {
      console.log('Location Seeder Failed');
    }
    process.exit(0);
  } catch (error) {
    console.error("Location Seeding failed:", error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  run();
}

export default run;
