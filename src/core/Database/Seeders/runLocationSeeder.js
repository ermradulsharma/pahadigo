import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { seedLocations } from '@/core/Seeders/locationSeeder.js';

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
    console.error('Error loading .env', e);
  }
};

const connectDB = async () => {
  try {
    loadEnv();
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri, {});
  } catch (error) {
    process.exit(1);
  }
};

const run = async () => {
  await connectDB();
  const result = await seedLocations();
  if (result) {
    console.log('Location Seeder Completed Successfully');
  } else {
    console.log('Location Seeder Failed');
  }

  process.exit(0);
};

if (process.env.NODE_ENV !== 'test') {
  run();
}

export default run;
