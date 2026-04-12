
import mongoose from 'mongoose';
import Vendor from '../src/core/Models/Vendor.js';
import VendorDocument from '../src/core/Models/VendorDocument.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkVendorStatus() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const vendorId = '69d8cf957ba7098746d85a45';
        const vendor = await Vendor.findById(vendorId).lean();
        
        if (!vendor) {
            console.log("VENDOR NOT FOUND");
            return;
        }

        console.log("--- VENDOR STATUS ---");
        console.log("ID:", vendor._id);
        console.log("Status:", vendor.status);
        console.log("isApproved:", vendor.isApproved);
        console.log("isOperating:", vendor.isOperating);
        console.log("Profile Type:", vendor.profileType);
        
        console.log("\n--- DOCUMENTS ---");
        console.log("PAN Status:", vendor.documents?.panCard?.status);
        console.log("Business Reg Status:", vendor.documents?.businessRegistration?.status);
        console.log("Aadhar Status:", vendor.documents?.aadharCard?.map(a => a.status));

        console.log("\n--- SELECTED CATEGORIES ---");
        console.log(vendor.category?.map(c => c.slug));

        console.log("\n--- CATEGORY DOCUMENTS (VendorDocument) ---");
        const catDocs = await VendorDocument.find({ vendor_id: vendorId }).lean();
        catDocs.forEach(d => {
            console.log(`Category: ${d.category_slug} | Doc: ${d.document_slug} | Status: ${d.status}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error("ERROR:", error);
    }
}

checkVendorStatus();
