import mongoose from 'mongoose';
import { seedLocations } from './LocationSeeder.js';
import { loadEnv } from '../../Helpers/env.js';
import connectDB from '../../Config/db.js';

const run = async () => {
  try {
    loadEnv();
    await connectDB();
    const result = await seedLocations();
    if (!result) {
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  run();
}

export default run;
