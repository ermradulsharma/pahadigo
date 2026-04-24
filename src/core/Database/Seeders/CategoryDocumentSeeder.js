import mongoose from "mongoose";
import CategoryDocument from '../../Models/CategoryDocument.js';
import Category from '../../Models/Category.js';
import { DEFAULTS } from '../../Constants/index.js';
import { CATEGORY_SLUGS } from '../../Constants/categories.js';
import connectDB from "../../Config/db.js";

const slugify = (text) => {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const DATA = [
  {
    category_slug: CATEGORY_SLUGS.HOMESTAY,
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
    ],
    isActive: DEFAULTS.TRUE
  },
  {
    category_slug: CATEGORY_SLUGS.HOTEL,
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
    ],
    isActive: DEFAULTS.TRUE
  },
  {
    category_slug: CATEGORY_SLUGS.CAMPING,
    documents: [
      "Business License",
      "Safety & Emergency Plan",
      "Land Owner Permission / Lease Agreement",
      "Forest Department Permission",
      "Fire Safety Plan",
      "Environmental Clearance",
      "First Aid & Medical Tie-up Proof",
      "Staff Training Certificate"
    ],
    isActive: DEFAULTS.TRUE
  },
  {
    category_slug: CATEGORY_SLUGS.TREKKING,
    documents: [
      "Adventure Sports License",
      "Guide Certification",
      "Liability Waiver Form",
      "Forest / Wildlife Department Permit",
      "Route Map & Risk Assessment Document",
      "Medical Emergency Tie-up Proof",
      "Participant Medical Fitness Form",
      "Equipment Safety Check Certificate"
    ],
    isActive: DEFAULTS.TRUE
  },
  {
    category_slug: CATEGORY_SLUGS.RAFTING,
    documents: [
      "River Rafting Permit",
      "Technical Safety Certificate",
      "Insurance Coverage Document",
      "Tourism Authority Approval",
      "River Usage Permission",
      "Equipment Inspection Certificate",
      "Rescue Staff Certification",
      "Emergency Evacuation Plan"
    ],
    isActive: DEFAULTS.TRUE
  },
  {
    category_slug: CATEGORY_SLUGS.BUNGEE_JUMPING,
    documents: [
      "Adventure Sports License",
      "Safety Audit Report",
      "Structural Fitness Certificate",
      "Third-Party Safety Audit",
      "Equipment Manufacturer Certificate",
      "Staff Technical Training Certificate",
      "Medical Emergency Tie-up",
      "Participant Medical Fitness Form"
    ],
    isActive: DEFAULTS.TRUE
  },
  {
    category_slug: CATEGORY_SLUGS.BIKE_SCOOTER_RENTAL,
    documents: [
      "Business License",
      "RTO Permit",
      "Insurance & Tax Receipt",
      "Vehicle Registration Certificate (RC)",
      "Commercial Permit",
      "PUC Certificate",
      "Rental Agreement Format",
      "Customer ID Verification Policy"
    ],
    isActive: DEFAULTS.TRUE
  },
  {
    category_slug: CATEGORY_SLUGS.CUSTOM_TRIP,
    documents: [
      "Business License",
      "Commercial Vehicle Permit",
      "Insurance & Tax Receipt",
      "Driver License (Transport Category)",
      "Driver Police Verification",
      "Trip Agreement",
      "Passenger Manifest"
    ],
    isActive: DEFAULTS.TRUE
  },
  {
    category_slug: CATEGORY_SLUGS.CHARDHAM_TOUR,
    documents: [
      "Travel Agent Permit",
      "Passenger Insurance Policy",
      "Uttarakhand Tourism Registration",
      "Vehicle Fitness Certificate",
      "Driver Hill Area Driving Certificate",
      "Medical Emergency Plan",
      "Yatra Registration Proof"
    ],
    isActive: DEFAULTS.TRUE
  }
];

export const seedCategoryDocuments = async () => {
  for (const service of DATA) {
    for (const docName of service.documents) {
      let document = await CategoryDocument.findOne({
        category_slug: service.category_slug,
        name: docName
      });

      if (document) {
        document.isMandatory = DEFAULTS.FALSE;
        document.isActive = service.isActive;
        await document.save();
      } else {
        let baseSlug = slugify(docName);
        let uniqueSlug = baseSlug;
        let counter = 2;

        while (DEFAULTS.TRUE) {
          const existingSlugDoc = await CategoryDocument.findOne({ slug: uniqueSlug, category_slug: service.category_slug });
          if (!existingSlugDoc) break;
          uniqueSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        await CategoryDocument.create({ category_slug: service.category_slug, name: docName, slug: uniqueSlug, isMandatory: DEFAULTS.FALSE, isActive: service.isActive });
      }
    }
  }

};

export default seedCategoryDocuments;
