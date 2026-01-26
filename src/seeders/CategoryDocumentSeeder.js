import mongoose from "mongoose";
import CategoryDocument from "../models/CategoryDocument.js";

const slugify = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '');            // Trim - from end
};

const DATA = [
    {
        category_slug: "homestay",
        documents: [
            "Homestay Registration Certificate",
            "FSSAI License",
            "GST Certificate",
            "Property Ownership Proof / Rent Agreement",
            "Local Authority NOC",
            "Fire Safety Certificate",
            "Police Verification",
            "Trade License",
            "Waste Management Declaration"
        ]
    },
    {
        category_slug: "hotel",
        documents: [
            "Hotel License",
            "FSSAI License",
            "GST Certificate",
            "Fire NOC",
            "Lift Safety Certificate",
            "Pollution Control Board NOC",
            "Building Completion Certificate",
            "Health Trade License",
            "Water Testing Report"
        ]
    },
    {
        category_slug: "camping",
        documents: [
            "Business License",
            "Safety & Emergency Plan",
            "Land Owner Permission / Lease Agreement",
            "Forest Department Permission",
            "Fire Safety Plan",
            "Environmental Clearance",
            "First Aid & Medical Tie-up Proof",
            "Staff Training Certificate"
        ]
    },
    {
        category_slug: "trekking",
        documents: [
            "Adventure Sports License",
            "Guide Certification",
            "Liability Waiver Form",
            "Forest / Wildlife Department Permit",
            "Route Map & Risk Assessment Document",
            "Medical Emergency Tie-up Proof",
            "Participant Medical Fitness Form",
            "Equipment Safety Check Certificate"
        ]
    },
    {
        category_slug: "rafting",
        documents: [
            "River Rafting Permit",
            "Technical Safety Certificate",
            "Insurance Coverage Document",
            "Tourism Authority Approval",
            "River Usage Permission",
            "Equipment Inspection Certificate",
            "Rescue Staff Certification",
            "Emergency Evacuation Plan"
        ]
    },
    {
        category_slug: "bungee-jumping",
        documents: [
            "Adventure Sports License",
            "Safety Audit Report",
            "Structural Fitness Certificate",
            "Third-Party Safety Audit",
            "Equipment Manufacturer Certificate",
            "Staff Technical Training Certificate",
            "Medical Emergency Tie-up",
            "Participant Medical Fitness Form"
        ]
    },
    {
        category_slug: "bike-scooter-rental",
        documents: [
            "Business License",
            "RTO Permit",
            "Insurance & Tax Receipt",
            "Vehicle Registration Certificate (RC)",
            "Commercial Permit",
            "PUC Certificate",
            "Rental Agreement Format",
            "Customer ID Verification Policy"
        ]
    },
    {
        category_slug: "custom-trip",
        documents: [
            "Business License",
            "Commercial Vehicle Permit",
            "Insurance & Tax Receipt",
            "Driver License (Transport Category)",
            "Driver Police Verification",
            "Trip Agreement",
            "Passenger Manifest"
        ]
    },
    {
        category_slug: "chardham-tour",
        documents: [
            "Travel Agent Permit",
            "Passenger Insurance Policy",
            "Uttarakhand Tourism Registration",
            "Vehicle Fitness Certificate",
            "Driver Hill Area Driving Certificate",
            "Medical Emergency Plan",
            "Yatra Registration Proof"
        ]
    }
];

export const seedCategoryDocuments = async () => {
    for (const service of DATA) {
        for (const docName of service.documents) {
            // Check if document already exists for this category
            let document = await CategoryDocument.findOne({
                category_slug: service.category_slug,
                name: docName
            });

            if (document) {
                // Update existing
                document.isMandatory = false;
                await document.save();
            } else {
                // Create new with unique slug logic
                let baseSlug = slugify(docName);
                let uniqueSlug = baseSlug;
                let counter = 2;

                while (true) {
                    const existingSlugDoc = await CategoryDocument.findOne({ slug: uniqueSlug });
                    if (!existingSlugDoc) break; // Slug is free
                    uniqueSlug = `${baseSlug}-${counter}`;
                    counter++;
                }

                await CategoryDocument.create({
                    category_slug: service.category_slug,
                    name: docName,
                    slug: uniqueSlug,
                    isMandatory: false
                });
            }
        }
    }

    console.log("✅ Category documents seeded successfully");
};
