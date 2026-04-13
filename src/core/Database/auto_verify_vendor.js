import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple .env parser to avoid dependency on dotenv
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../../../.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            envContent.split('\n').forEach(line => {
                const [key, ...value] = line.split('=');
                if (key && value) {
                    process.env[key.trim()] = value.join('=').trim().replace(/^['"]|['"]$/g, '');
                }
            });
        }
    } catch (e) {
        console.error("Error loading .env file:", e);
    }
}

loadEnv();

import User from '../Models/User.js';
import Vendor from '../Models/Vendor.js';
import VendorDocument from '../Models/VendorDocument.js';
import dbConnect from '../Config/db.js';
import { VERIFICATION_STATUS } from '../Constants/index.js';

async function autoVerify() {
  await dbConnect();
  try {
    const user = await User.findOne({ email: 'vendor@pahadigo.com' });
    if (!user) {
        console.log("User not found: vendor@pahadigo.com - Please run the user seeder first.");
        process.exit(0);
    }

    const vendor = await Vendor.findOne({ user: user._id });
    if (!vendor) {
        console.log("Vendor profile not found for user:", user._id);
        process.exit(0);
    }

    // 1. Activate Vendor Profile
    vendor.status = 'active';
    vendor.isOperating = true;
    vendor.isApproved = true;
    
    // Ensure core documents are marked verified
    if (vendor.documents) {
        if (vendor.documents.panCard) vendor.documents.panCard.status = VERIFICATION_STATUS.VERIFIED;
        if (vendor.documents.businessRegistration) vendor.documents.businessRegistration.status = VERIFICATION_STATUS.VERIFIED;
        if (vendor.documents.aadharCard && Array.isArray(vendor.documents.aadharCard)) {
            vendor.documents.aadharCard.forEach(d => d.status = VERIFICATION_STATUS.VERIFIED);
        }
    }
    await vendor.save();
    console.log("Vendor Profile Activated & Verified.");

    // 2. Add/Verify Category Documents for Homestay (to make it show up in public list)
    const categories = ['homestay', 'hotel', 'camping', 'trekking', 'rafting', 'bungee-jumping', 'bike-scooter-rental', 'chardham-tour', 'custom-trip'];
    
    for (const slug of categories) {
        await VendorDocument.findOneAndUpdate(
            { vendor: vendor._id, category_slug: slug, document_slug: 'auto-verified' },
            { 
                user: user._id, 
                url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
                status: VERIFICATION_STATUS.VERIFIED 
            },
            { upsert: true }
        );
    }
    console.log("All categories auto-verified with dummy documents.");

  } catch (err) {
    console.error("Execution error:", err);
  } finally {
    process.exit(0);
  }
}

autoVerify();
