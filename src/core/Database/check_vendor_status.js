import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic relative imports based on script location (src/core/Database/)
import User from '../Models/User.js';
import Vendor from '../Models/Vendor.js';
import VendorDocument from '../Models/VendorDocument.js';
import dbConnect from '../../config/db.js';

async function checkStatus() {
  await dbConnect();
  try {
    const user = await User.findOne({ email: 'vendor@pahadigo.com' });
    if (!user) {
        console.log("User not found: vendor@pahadigo.com");
        process.exit(0);
    }
    console.log("User ID:", user._id);

    const vendor = await Vendor.findOne({ user: user._id });
    if (!vendor) {
        console.log("Vendor profile not found for user:", user._id);
        process.exit(0);
    }
    console.log("Vendor ID:", vendor._id);
    console.log("Vendor Status:", vendor.status);
    console.log("isOperating:", vendor.isOperating);
    console.log("isApproved:", vendor.isApproved);
    console.log("Profile Type:", vendor.profileType);
    console.log("Documents Status:", JSON.stringify(vendor.documents, null, 2));

    const categoryDocs = await VendorDocument.find({ vendor: vendor._id });
    console.log("Category Documents Count:", categoryDocs.length);
    categoryDocs.forEach(d => {
        console.log(`- Category: ${d.category_slug}, Doc: ${d.document_slug}, Status: ${d.status}`);
    });
  } catch (err) {
    console.error("Execution error:", err);
  } finally {
    process.exit(0);
  }
}

checkStatus();
