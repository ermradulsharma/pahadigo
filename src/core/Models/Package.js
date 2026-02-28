import mongoose from 'mongoose';
import { PACKAGE } from '@/constants/index.js';

// --- Service Sub-Schemas ---

const priceWithDecimal = { type: Number, required: true, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };
const optionalPriceWithDecimal = { type: Number, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };

const HomestaySchema = new mongoose.Schema({
    // --- Basic Info ---
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },

    // --- Type & Classification ---
    homestayType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.HOMESTAY_TYPES), default: PACKAGE.ACCOMMODATION.HOMESTAY_TYPES.COTTAGE, required: true },

    // --- Availability ---
    availability: {
        totalRooms: { type: Number, default: 0 },
        availableRooms: { type: Number, default: 0 },
        occupiedRooms: { type: Number, default: 0 },
        reservedRooms: { type: Number, default: 0 },
        cancelledRooms: { type: Number, default: 0 }
    },

    // --- Room Details ---
    roomDetails: {
        rentalType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.RENTAL_TYPES), default: PACKAGE.ACCOMMODATION.RENTAL_TYPES.PRIVATE_ROOM },
        roomType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.ROOM_TYPES), default: PACKAGE.ACCOMMODATION.ROOM_TYPES.STANDARD, required: true },
        roomSize: { type: Number },
        bedType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.BED_TYPES), default: PACKAGE.ACCOMMODATION.BED_TYPES.DOUBLE },
        bathroomType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.BATHROOM_TYPES), default: PACKAGE.ACCOMMODATION.BATHROOM_TYPES.PRIVATE },
        baths: { type: Number, default: 1 },
        balcony: { type: Boolean, default: false },
        view: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.VIEW_TYPES), default: PACKAGE.ACCOMMODATION.VIEW_TYPES.MOUNTAIN }
    },

    // --- Pricing & Capacity ---
    pricing: {
        pricePerNight: optionalPriceWithDecimal,
        maxGuestPerRoom: { type: Number, default: 2 },
        maxAdults: { type: Number, default: 2 },
        maxChildren: { type: Number, default: 1 },
        childPrice: optionalPriceWithDecimal,
        extraBedAvailable: { type: Boolean, default: false },
        extraBedPrice: optionalPriceWithDecimal
    },

    // --- Timings ---
    timings: {
        checkIn: { type: String, default: '12:00 PM' },
        checkOut: { type: String, default: '11:00 AM' },
    },

    // --- Policies ---
    policies: {
        houseRules: { type: String, default: '' },
        cancellationPolicy: { type: String, default: '' },
        isCouplesFriendly: { type: Boolean, default: false },
        isPetFriendly: { type: Boolean, default: false },
        isSmokingAllowed: { type: Boolean, default: false },
    },

    amenities: { type: String, default: '' },
    mealsIncluded: { type: String, default: '' },

    // --- Location Details ---
    location: {
        address: { type: String, required: true, default: '' },
        latitude: { type: String, default: null },
        longitude: { type: String, default: null },
        coordinates: {
            type: { type: String, default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] }
        }
    },

    // --- Media ---
    photos: [{
        url: { type: String, default: '' },
        type: { type: String, default: '' }
    }],

    seoMetadata: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: { type: String, default: '' }
    }

}, { toJSON: { getters: true }, toObject: { getters: true } });

const CampingSchema = new mongoose.Schema({
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    isActive: { type: Boolean, default: true },

    pricing: {
        pricePerPerson: optionalPriceWithDecimal,
        foodIncluded: { type: Boolean, default: false },
        maxGuests: { type: Number, default: 2 },
    },

    details: {
        campingType: { type: String, enum: Object.values(PACKAGE.ACTIVITY.CAMPING_TYPES), default: PACKAGE.ACTIVITY.CAMPING_TYPES.RIVERSIDE },
        activitiesIncluded: [{ type: String }],
    },

    timings: {
        checkIn: { type: String, default: '12:00 PM' },
        checkOut: { type: String, default: '11:00 AM' },
    },

    policies: {
        houseRules: [{ type: String, default: '' }],
        cancellationPolicy: { type: String, default: '' },
    },

    location: {
        address: { type: String, required: true, default: '' },
        latitude: { type: String, default: null },
        longitude: { type: String, default: null },
        coordinates: {
            type: { type: String, default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] }
        }
    },
    amenities: [{ title: { type: String, default: '' } }],
    photos: [{ url: { type: String, default: '' }, type: { type: String, default: '' } }],
    seoMetadata: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: [{ type: String, default: '' }]
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });

const TrekkingSchema = new mongoose.Schema({
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    isActive: { type: Boolean, default: true },

    pricing: {
        pricePerPerson: optionalPriceWithDecimal,
    },

    details: {
        trekType: { type: String, enum: Object.values(PACKAGE.ACTIVITY.TREK_TYPES), default: PACKAGE.ACTIVITY.TREK_TYPES.DAY_TREK },
        difficultyLevel: { type: String, enum: Object.values(PACKAGE.DIFFICULTY), default: PACKAGE.DIFFICULTY.EASY },
        bestSeason: { type: String, enum: Object.values(PACKAGE.SEASONS), default: PACKAGE.SEASONS.ALL_YEAR },
        duration: { type: String, default: '' },
        maxAltitude: { type: String, default: '' },
        trekDistance: { type: String, default: '' },
        guideAvailable: { type: Boolean, default: true },
        inclusions: [{ type: String, default: '' }],
        exclusions: [{ type: String, default: '' }],
    },

    itinerary: [{
        day: { type: Number, default: 1 },
        title: { type: String, default: '' },
        description: { type: String, default: '' }
    }],

    location: {
        address: { type: String, required: true, default: '' },
        latitude: { type: String, default: null },
        longitude: { type: String, default: null },
        coordinates: {
            type: { type: String, default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] }
        }
    },
    amenities: [{ title: { type: String, default: '' } }],
    photos: [{ url: { type: String, default: '' }, type: { type: String, default: '' } }],
    seoMetadata: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: [{ type: String, default: '' }]
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });

const RaftingSchema = new mongoose.Schema({
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    isActive: { type: Boolean, default: true },

    pricing: {
        pricePerPerson: optionalPriceWithDecimal,
    },

    details: {
        stretchName: { type: String, default: '' },
        distanceKm: { type: Number, default: 0 },
        duration: { type: String, default: '' },
        difficultyLevel: { type: String, enum: Object.values(PACKAGE.DIFFICULTY), default: PACKAGE.DIFFICULTY.EASY },
        rapidGrade: { type: String, enum: Object.values(PACKAGE.ACTIVITY.RAPID_GRADES), default: PACKAGE.ACTIVITY.RAPID_GRADES.I },
        batchSize: { type: Number, default: 0 },
        safetyGearProvided: { type: Boolean, default: true },
    },

    policies: {
        minAge: { type: Number, default: 0 },
        maxAge: { type: Number, default: 0 },
        maxWeightKg: { type: Number, default: 0 },
    },

    location: {
        address: { type: String, default: null },
        latitude: { type: String, default: null },
        longitude: { type: String, default: null },
        coordinates: {
            type: { type: String, default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] }
        }
    },
    amenities: [{ title: { type: String, default: '' } }],
    photos: [{ url: { type: String, default: '' }, type: { type: String, default: '' } }],
    seoMetadata: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: [{ type: String, default: '' }]
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });

const BungeeSchema = new mongoose.Schema({
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    isActive: { type: Boolean, default: true },

    pricing: {
        pricePerPerson: optionalPriceWithDecimal,
    },

    details: {
        jumpName: { type: String, default: '' },
        heightMeters: { type: Number, default: 0 },
        safetyStandards: { type: String, default: '' },
        videoIncluded: { type: Boolean, default: false },
        transferIncluded: { type: Boolean, default: false },
    },

    policies: {
        minAge: { type: Number, default: 0 },
        maxWeightKg: { type: Number, default: 0 },
    },

    location: {
        address: { type: String, default: null },
        latitude: { type: String, default: null },
        longitude: { type: String, default: null },
        coordinates: {
            type: { type: String, default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] }
        }
    },
    amenities: [{ title: { type: String, default: '' } }],
    photos: [{ url: { type: String, default: '' }, type: { type: String, default: '' } }],
    seoMetadata: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: [{ type: String, default: '' }]
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });

const VehicleRentalSchema = new mongoose.Schema({
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    isActive: { type: Boolean, default: true },

    pricing: {
        pricePerDay: optionalPriceWithDecimal,
        depositAmount: optionalPriceWithDecimal,
    },

    vehicleDetails: {
        vehicleType: { type: String, enum: Object.values(PACKAGE.TRANSPORT.VEHICLE_TYPES), default: PACKAGE.TRANSPORT.VEHICLE_TYPES.BIKE },
        model: { type: String, default: '' },
        brand: { type: String, default: '' },
        year: { type: Number, default: new Date().getFullYear() },
        transmission: { type: String, enum: Object.values(PACKAGE.TRANSPORT.TRANSMISSION_TYPES), default: PACKAGE.TRANSPORT.TRANSMISSION_TYPES.MANUAL },
        seats: { type: Number, default: 2 },
        fuelPolicy: { type: String, enum: Object.values(PACKAGE.TRANSPORT.FUEL_POLICIES), default: PACKAGE.TRANSPORT.FUEL_POLICIES.FULL_TO_FULL },
    },

    policies: {
        minAge: { type: Number, default: 18 },
    },

    location: {
        address: { type: String, default: null },
        latitude: { type: String, default: null },
        longitude: { type: String, default: null },
        coordinates: {
            type: { type: String, default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] }
        }
    },
    amenities: [{ title: { type: String, default: '' } }],
    photos: [{ url: { type: String, default: '' }, type: { type: String, default: '' } }],
    seoMetadata: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: [{ type: String, default: '' }]
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });

const ChardhamTourSchema = new mongoose.Schema({
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    isActive: { type: Boolean, default: true },

    pricing: {
        pricePerPerson: optionalPriceWithDecimal,
    },

    tourDetails: {
        tourName: { type: String, default: '' },
        duration: { type: String, default: '' },
        placesCovered: [{ type: String }],
        bestSeason: { type: String, enum: Object.values(PACKAGE.SEASONS), default: PACKAGE.SEASONS.ALL_YEAR },
        transportType: { type: String, enum: Object.values(PACKAGE.TRANSPORT.TOUR_MODE) },
        hotelType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.HOTEL_TYPES), default: PACKAGE.ACCOMMODATION.HOTEL_TYPES.BUDGET },
        nightStayLocations: [{ type: String }],
        inclusions: { type: String, default: '' },
    },

    location: {
        address: { type: String, default: null },
        latitude: { type: String, default: null },
        longitude: { type: String, default: null },
        coordinates: {
            type: { type: String, default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] }
        }
    },
    amenities: [{ title: { type: String, default: '' } }],
    photos: [{ url: { type: String, default: '' }, type: { type: String, default: '' } }],
    seoMetadata: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: [{ type: String, default: '' }]
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });

const SkiingSchema = new mongoose.Schema({
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    isActive: { type: Boolean, default: true },

    pricing: {
        pricePerPerson: optionalPriceWithDecimal,
    },

    details: {
        slopeName: { type: String, default: '' },
        difficultyLevel: { type: String, enum: Object.values(PACKAGE.ACTIVITY.SKI_DIFFICULTY), default: PACKAGE.ACTIVITY.SKI_DIFFICULTY.BEGINNER },
        duration: { type: String, default: '' },
        instructorIncluded: { type: Boolean, default: true },
        equipmentIncluded: { type: Boolean, default: true },
        videoIncluded: { type: Boolean, default: false },
    },

    location: {
        address: { type: String, default: null },
        latitude: { type: String, default: null },
        longitude: { type: String, default: null },
        coordinates: {
            type: { type: String, default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] }
        }
    },
    amenities: [{ title: { type: String, default: '' } }],
    photos: [{ url: { type: String, default: '' }, type: { type: String, default: '' } }],
    seoMetadata: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: [{ type: String, default: '' }]
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });

const ParaglidingSchema = new mongoose.Schema({
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    isActive: { type: Boolean, default: true },

    pricing: {
        pricePerPerson: optionalPriceWithDecimal,
    },

    details: {
        siteName: { type: String, default: '' },
        flyType: { type: String, enum: Object.values(PACKAGE.ACTIVITY.PARAGLIDING_TYPES), default: PACKAGE.ACTIVITY.PARAGLIDING_TYPES.SHORT_FLY },
        duration: { type: String, default: '' },
        heightFeet: { type: Number, default: 0 },
        videoIncluded: { type: Boolean, default: false },
        transferIncluded: { type: Boolean, default: false },
    },

    location: {
        address: { type: String, default: null },
        latitude: { type: String, default: null },
        longitude: { type: String, default: null },
        coordinates: {
            type: { type: String, default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] }
        }
    },
    amenities: [{ title: { type: String, default: '' } }],
    photos: [{ url: { type: String, default: '' }, type: { type: String, default: '' } }],
    seoMetadata: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: [{ type: String, default: '' }]
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });


// --- Root Catalog Schema ---

const VendorPackageSchema = new mongoose.Schema({
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, unique: true },

    homestay: [HomestaySchema],
    camping: [CampingSchema],
    trekking: [TrekkingSchema],
    rafting: [RaftingSchema],
    bungeeJumping: [BungeeSchema],
    vehicleRental: [VehicleRentalSchema],
    chardhamTour: [ChardhamTourSchema],
    hotel: [HomestaySchema], // fallback
    skiing: [SkiingSchema],
    paragliding: [ParaglidingSchema],

    price: { type: Number, default: 0, min: 0 },

    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Package || mongoose.model('Package', VendorPackageSchema);
