import mongoose from 'mongoose';
import User from '../../Models/User.js';
import Vendor from '../../Models/Vendor.js';
import Package from '../../Models/Package.js';
import { STATUS, USER_ROLES } from '../../Constants/index.js';

/**
 * PackageSeeder - Seeds business profiles and package items for testing.
 */
export const seedPackages = async () => {
    try {
        // 1. Find the sample vendor user
        const vendorUser = await User.findOne({ role: USER_ROLES.VENDOR });
        if (!vendorUser) {
            console.error("No vendor user found to attach packages to.");
            return;
        }

        // 2. Create Vendor Business Profile if not exists
        let vendorProfile = await Vendor.findOne({ user: vendorUser._id });
        if (!vendorProfile) {
            vendorProfile = await Vendor.create({
                user: vendorUser._id,
                name: "Pahadi Adventures",
                description: "Authentic Himalayan experiences",
                status: STATUS.ACTIVE,
                isOperating: true,
                address: {
                    line1: "Main St",
                    city: "Manali",
                    state: "Himachal Pradesh",
                    country: "India",
                    pincode: "175131",
                    location: { type: "Point", coordinates: [77.1892, 32.2432] }
                }
            });
        }

        // 3. Clear existing packages for this vendor
        await Package.deleteMany({ vendor: vendorUser._id });

        // 4. Create Sample Packages
        const samplePackage = new Package({
            vendor: vendorUser._id,
            business: vendorProfile._id,
            homestay: [
                {
                    title: "Riverside Apple Orchard Cottage",
                    description: "A cozy cottage in the middle of an apple orchard.",
                    isActive: true,
                    pricing: { basePrice: 2500, currency: 'INR' },
                    location: { address: "Old Manali", city: "Manali" },
                    photos: ["https://images.unsplash.com/photo-1510798831971-661eb04b3739"]
                }
            ],
            hotel: [
                {
                    title: "Snow View Resort",
                    description: "Luxury stay with mountain views.",
                    isActive: true,
                    pricing: { basePrice: 5500, currency: 'INR' },
                    location: { address: "Mall Road", city: "Manali" },
                    photos: ["https://images.unsplash.com/photo-1566073771259-6a8506099945"]
                }
            ],
            camping: [
                {
                    title: "Starlight Riverside Camp",
                    description: "Camp under the stars by the Beas river.",
                    isActive: true,
                    pricing: { basePrice: 1500, currency: 'INR' },
                    location: { address: "Solang Valley", city: "Manali" },
                    photos: ["https://images.unsplash.com/photo-1504280390367-361c6d9f38f4"]
                }
            ],
            trekking: [
                {
                    title: "Beas Kund Trek",
                    description: "A beautiful trek to the source of river Beas.",
                    isActive: true,
                    pricing: { basePrice: 3500, currency: 'INR' },
                    location: { address: "Dhundi", city: "Manali" },
                    photos: ["https://images.unsplash.com/photo-1551632811-561732d1e306"]
                }
            ]
        });

        await samplePackage.save();
        console.log("Packages seeded successfully for vendor:", vendorUser.name);
        return { count: 1 };
    } catch (error) {
        console.error("Package seeding failed:", error);
        throw error;
    }
};

export default seedPackages;
