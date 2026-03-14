import mongoose from 'mongoose';
import { PACKAGE } from '@/constants/index.js';

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
    mealsIncluded: { type: Boolean, default: true },
    mealType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.MEAL_TYPES), default: PACKAGE.ACCOMMODATION.MEAL_TYPES.NO_MEALS },

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

const HotelSchema = new mongoose.Schema({
    // --- Basic Info ---
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    isActive: { type: Boolean, default: true },

    // --- Type & Classification ---
    hotelType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.HOTEL_TYPES), default: PACKAGE.ACCOMMODATION.HOTEL_TYPES.BUDGET, required: true },
    starRating: { type: Number, min: 1, max: 5, default: 3 },

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
        roomType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.ROOM_TYPES), default: PACKAGE.ACCOMMODATION.ROOM_TYPES.STANDARD, required: true },
        roomSizeSqFt: { type: Number, default: 0 },
        bedType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.BED_TYPES), default: PACKAGE.ACCOMMODATION.BED_TYPES.DOUBLE },
        view: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.VIEW_TYPES), default: PACKAGE.ACCOMMODATION.VIEW_TYPES.CITY },
        isAC: { type: Boolean, default: true },
        hasBalcony: { type: Boolean, default: false }
    },

    // --- Pricing & Capacity ---
    pricing: {
        pricePerNight: priceWithDecimal,
        maxGuestPerRoom: { type: Number, default: 2 },
        maxAdults: { type: Number, default: 2 },
        maxChildren: { type: Number, default: 1 },
        childPrice: optionalPriceWithDecimal,
        extraBedAvailable: { type: Boolean, default: false },
        extraBedPrice: optionalPriceWithDecimal
    },

    // --- Timings ---
    timings: {
        checkIn: { type: String, default: '02:00 PM' },
        checkOut: { type: String, default: '11:00 AM' },
    },

    // --- Policies ---
    policies: {
        cancellationPolicy: { type: String, default: 'Free cancellation up to 24 hours before check-in.' },
        isCouplesFriendly: { type: Boolean, default: true },
        isPetFriendly: { type: Boolean, default: false },
        isSmokingAllowed: { type: Boolean, default: false },
        requiresLocalID: { type: Boolean, default: false }
    },

    amenities: { type: String, default: 'WiFi, TV, AC, Geyser' }, // Stored as a comma-separated string
    mealsIncluded: { type: Boolean, default: false },
    mealType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.MEAL_TYPES), default: PACKAGE.ACCOMMODATION.MEAL_TYPES.NO_MEALS },

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

    // --- Availability ---
    availability: {
        totalTents: { type: Number, default: 0 },
        availableTents: { type: Number, default: 0 },
        occupiedTents: { type: Number, default: 0 },
        reservedTents: { type: Number, default: 0 },
        cancelledTents: { type: Number, default: 0 }
    },

    // --- Pricing & Capacity ---
    pricing: {
        pricePerPerson: optionalPriceWithDecimal,
        maxGuests: { type: Number, default: 2 },
        maxAdults: { type: Number, default: 2 },
        maxChildren: { type: Number, default: 1 },
        childPrice: optionalPriceWithDecimal,
        extraBedAvailable: { type: Boolean, default: false },
        extraBedPrice: optionalPriceWithDecimal,
    },

    details: {
        campingType: { type: String, enum: Object.values(PACKAGE.ACTIVITY.CAMPING_TYPES), default: PACKAGE.ACTIVITY.CAMPING_TYPES.RIVERSIDE },
        bathroomType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.BATHROOM_TYPES), default: PACKAGE.ACCOMMODATION.BATHROOM_TYPES.SHARED },
        electricityAvailable: { type: Boolean, default: false },
        activitiesIncluded: { type: String, default: '' },
    },

    timings: {
        checkIn: { type: String, default: '12:00 PM' },
        checkOut: { type: String, default: '11:00 AM' },
    },

    // --- Policies ---
    policies: {
        campingRules: { type: String, default: '' },
        campingSafetyRules: { type: String, default: '' },
        cancellationPolicy: { type: String, default: '' },
        isCouplesFriendly: { type: Boolean, default: false },
        isPetFriendly: { type: Boolean, default: false },
        isSmokingAllowed: { type: Boolean, default: false },
        isCampfireAllowed: { type: Boolean, default: false },
        isMusicAllowed: { type: Boolean, default: false }
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

    amenities: { type: String, default: '' },
    mealsIncluded: { type: Boolean, default: true },
    mealType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.MEAL_TYPES), default: PACKAGE.ACCOMMODATION.MEAL_TYPES.NO_MEALS },

    photos: [{ url: { type: String, default: '' }, type: { type: String, default: '' } }],
    seoMetadata: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: { type: String, default: '' }
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });

const TrekkingSchema = new mongoose.Schema({
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    isActive: { type: Boolean, default: true },

    // --- Availability ---
    availability: {
        totalSlots: { type: Number, default: 0 },
        availableSlots: { type: Number, default: 0 },
        bookedSlots: { type: Number, default: 0 },
        cancelledSlots: { type: Number, default: 0 }
    },

    // --- Pricing ---
    pricing: {
        pricePerPerson: optionalPriceWithDecimal,
        porterPricePerDay: optionalPriceWithDecimal,
    },

    // --- Core Details ---
    details: {
        trekType: { type: String, enum: Object.values(PACKAGE.ACTIVITY.TREK_TYPES), default: PACKAGE.ACTIVITY.TREK_TYPES.DAY_TREK },
        difficultyLevel: { type: String, enum: Object.values(PACKAGE.DIFFICULTY), default: PACKAGE.DIFFICULTY.EASY },
        bestSeason: { type: String, enum: Object.values(PACKAGE.SEASONS), default: PACKAGE.SEASONS.ALL_YEAR },
        duration: { type: String, default: '' },
        maxAltitude: { type: String, default: '' },
        trekDistance: { type: String, default: '' },
        guideAvailable: { type: Boolean, default: true },
        porterAvailable: { type: Boolean, default: false },
        muleAvailable: { type: Boolean, default: false },
        minAge: { type: Number, default: 12 },
        fitnessLevelRequired: { type: String, default: '' },
        startPoint: {
            name: { type: String, default: '' },
            latitude: { type: String, default: null },
            longitude: { type: String, default: null },
            coordinates: {
                type: { type: String, default: 'Point' },
                coordinates: { type: [Number], default: [0, 0] }
            }
        },
        endPoint: {
            name: { type: String, default: '' },
            latitude: { type: String, default: null },
            longitude: { type: String, default: null },
            coordinates: {
                type: { type: String, default: 'Point' },
                coordinates: { type: [Number], default: [0, 0] }
            }
        },
        baseCamp: { type: String, default: '' },
        pickupPoint: { type: String, default: '' },
        dropPoint: { type: String, default: '' },
        inclusions: { type: String, default: '' },
        exclusions: { type: String, default: '' },
    },

    // --- Timings ---
    timings: {
        departureTime: { type: String, default: '06:00 AM' },
        reportingTime: { type: String, default: '05:30 AM' },
    },

    // --- Itinerary ---
    itinerary: [{
        day: { type: Number, default: 1 },
        title: { type: String, default: '' },
        description: { type: String, default: '' }
    }],

    // --- Policies ---
    policies: {
        thingsToCarry: { type: String, default: '' },
        healthAdvisory: { type: String, default: '' },
        cancellationPolicy: { type: String, default: '' },
    },

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

    // --- Extra Information ---
    amenities: { type: String, default: '' },
    mealsIncluded: { type: Boolean, default: true },
    mealType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.MEAL_TYPES), default: PACKAGE.ACCOMMODATION.MEAL_TYPES.NO_MEALS },

    // --- Media ---
    photos: [{ url: { type: String, default: '' }, type: { type: String, default: '' } }],

    // --- SEO ---
    seoMetadata: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: { type: String, default: '' }
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });

const RaftingSchema = new mongoose.Schema({
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    isActive: { type: Boolean, default: true },

    // --- Availability ---
    availability: {
        totalSeats: { type: Number, default: 0 },
        availableSeats: { type: Number, default: 0 },
        bookedSeats: { type: Number, default: 0 },
        cancelledSeats: { type: Number, default: 0 }
    },

    // --- Pricing ---
    pricing: {
        pricePerPerson: optionalPriceWithDecimal,
    },

    // --- Core Details ---
    details: {
        stretchName: { type: String, default: '' },
        distanceKm: { type: Number, default: 0 },
        duration: { type: String, default: '' },
        difficultyLevel: { type: String, enum: Object.values(PACKAGE.DIFFICULTY), default: PACKAGE.DIFFICULTY.EASY },
        rapidGrade: { type: String, enum: Object.values(PACKAGE.ACTIVITY.RAPID_GRADES), default: PACKAGE.ACTIVITY.RAPID_GRADES.I },
        batchSize: { type: Number, default: 0 },
        safetyGearProvided: { type: Boolean, default: true },
        inclusions: { type: String, default: '' },
        exclusions: { type: String, default: '' },
        startPoint: {
            name: { type: String, default: '' },
            latitude: { type: String, default: null },
            longitude: { type: String, default: null },
            coordinates: {
                type: { type: String, default: 'Point' },
                coordinates: { type: [Number], default: [0, 0] }
            }
        },
        endPoint: {
            name: { type: String, default: '' },
            latitude: { type: String, default: null },
            longitude: { type: String, default: null },
            coordinates: {
                type: { type: String, default: 'Point' },
                coordinates: { type: [Number], default: [0, 0] }
            }
        },
    },

    // --- Timings ---
    timings: {
        departureTime: { type: String, default: '06:00 AM' },
        reportingTime: { type: String, default: '05:30 AM' },
    },

    // --- Policies ---
    policies: {
        minAge: { type: Number, default: 0 },
        maxAge: { type: Number, default: 0 },
        maxWeightKg: { type: Number, default: 0 },
        thingsToCarry: { type: String, default: '' },
        healthAdvisory: { type: String, default: '' },
        cancellationPolicy: { type: String, default: '' },
    },

    // --- Location Details ---
    location: {
        address: { type: String, default: null },
        latitude: { type: String, default: null },
        longitude: { type: String, default: null },
        coordinates: {
            type: { type: String, default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] }
        }
    },

    // --- Extra Information ---
    amenities: { type: String, default: '' },
    mealsIncluded: { type: Boolean, default: true },
    mealType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.MEAL_TYPES), default: PACKAGE.ACCOMMODATION.MEAL_TYPES.NO_MEALS },

    // --- Media ---
    photos: [{ url: { type: String, default: '' }, type: { type: String, default: '' } }],

    // --- SEO ---
    seoMetadata: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: { type: String, default: '' }
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });

const BungeeSchema = new mongoose.Schema({
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    isActive: { type: Boolean, default: true },

    availability: {
        totalSlots: { type: Number, default: 0 },
        availableSlots: { type: Number, default: 0 },
        bookedSlots: { type: Number, default: 0 },
        cancelledSlots: { type: Number, default: 0 }
    },

    pricing: {
        pricePerPerson: optionalPriceWithDecimal,
    },

    details: {
        jumpName: { type: String, default: '' },
        jumpType: { type: String, default: 'Forward' },
        heightMeters: { type: Number, default: 0 },
        safetyStandards: { type: String, default: '' },
        videoIncluded: { type: Boolean, default: false },
        transferIncluded: { type: Boolean, default: false },
    },

    timings: {
        departureTime: { type: String, default: '06:00 AM' },
        reportingTime: { type: String, default: '05:30 AM' },
    },

    policies: {
        minAge: { type: Number, default: 0 },
        weightLimitKg: { type: Number, default: 0 },
        thingsToCarry: { type: String, default: '' },
        healthAdvisory: { type: String, default: '' },
        cancellationPolicy: { type: String, default: '' },
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

    amenities: { type: String, default: '' },
    mealsIncluded: { type: Boolean, default: true },
    mealType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.MEAL_TYPES), default: PACKAGE.ACCOMMODATION.MEAL_TYPES.NO_MEALS },

    photos: [{ url: { type: String, default: '' }, type: { type: String, default: '' } }],
    seoMetadata: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: { type: String, default: '' }
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });

const VehicleRentalSchema = new mongoose.Schema({
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    isActive: { type: Boolean, default: true },

    fleetAvailability: {
        totalVehicles: { type: Number, default: 0 },
        availableVehicles: { type: Number, default: 0 },
        rentedVehicles: { type: Number, default: 0 },
        maintenanceVehicles: { type: Number, default: 0 }
    },

    pricing: {
        pricePerDay: optionalPriceWithDecimal,
        pricePerHour: optionalPriceWithDecimal,
        depositAmount: optionalPriceWithDecimal,
        driverBatthaPerDay: optionalPriceWithDecimal,
    },

    vehicleDetails: {
        vehicleType: { type: String, enum: Object.values(PACKAGE.TRANSPORT.VEHICLE_TYPES), default: PACKAGE.TRANSPORT.VEHICLE_TYPES.BIKE },
        model: { type: String, default: '' },
        brand: { type: String, default: '' },
        year: { type: Number, default: new Date().getFullYear() },
        transmission: { type: String, enum: Object.values(PACKAGE.TRANSPORT.TRANSMISSION_TYPES), default: PACKAGE.TRANSPORT.TRANSMISSION_TYPES.MANUAL },
        seats: { type: Number, default: 2 },
        fuelPolicy: { type: String, enum: Object.values(PACKAGE.TRANSPORT.FUEL_POLICIES), default: PACKAGE.TRANSPORT.FUEL_POLICIES.FULL_TO_FULL },
        acAvailable: { type: Boolean, default: true },
        luggageCapacity: { type: Number, default: 0 },
        isDriverIncluded: { type: Boolean, default: false }
    },

    policies: {
        minAge: { type: Number, default: 18 },
        drivingLicenseRequired: { type: Boolean, default: true },
        securityDeposit: { type: String, default: '' },
        lateReturnFee: { type: String, default: '' },
        cancellationPolicy: { type: String, default: '' },
        pickupRequirements: { type: String, default: '' },
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

    features: { type: String, default: '' },

    photos: [{ url: { type: String, default: '' }, type: { type: String, default: '' } }],
    seoMetadata: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: { type: String, default: '' }
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });

const ChardhamTourSchema = new mongoose.Schema({
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    isActive: { type: Boolean, default: true },

    availability: {
        totalSeats: { type: Number, default: 0 },
        availableSeats: { type: Number, default: 0 },
        bookedSeats: { type: Number, default: 0 },
        reservedSeats: { type: Number, default: 0 },
        cancelledSeats: { type: Number, default: 0 }
    },

    pricing: {
        pricePerPerson: optionalPriceWithDecimal,
        childPrice: optionalPriceWithDecimal,
        infantPrice: optionalPriceWithDecimal,
    },

    tourDetails: {
        tourName: { type: String, default: '' },
        duration: { type: String, default: '' },
        placesCovered: { type: String, default: '' },
        bestSeason: { type: String, enum: Object.values(PACKAGE.SEASONS), default: PACKAGE.SEASONS.ALL_YEAR },
        transportType: { type: String, enum: Object.values(PACKAGE.TRANSPORT.TOUR_MODE) },
        hotelType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.HOTEL_TYPES), default: PACKAGE.ACCOMMODATION.HOTEL_TYPES.BUDGET },
        nightStayLocations: { type: String, default: '' },
        inclusions: { type: String, default: '' },
        exclusions: { type: String, default: '' },
        helicopterIncluded: { type: Boolean, default: false },
        yatraStartsFrom: { type: String, default: 'Haridwar' },
        startPoint: {
            name: { type: String, default: '' },
            latitude: { type: String, default: null },
            longitude: { type: String, default: null },
            coordinates: {
                type: { type: String, default: 'Point' },
                coordinates: { type: [Number], default: [0, 0] }
            }
        },
        endPoint: {
            name: { type: String, default: '' },
            latitude: { type: String, default: null },
            longitude: { type: String, default: null },
            coordinates: {
                type: { type: String, default: 'Point' },
                coordinates: { type: [Number], default: [0, 0] }
            }
        },
    },

    timings: {
        departureTime: { type: String, default: '06:00 AM' },
        reportingTime: { type: String, default: '05:30 AM' },
    },

    itinerary: [{
        day: { type: Number, default: 1 },
        title: { type: String, default: '' },
        description: { type: String, default: '' }
    }],

    policies: {
        thingsToCarry: { type: String, default: '' },
        healthAdvisory: { type: String, default: '' },
        medicalCertificateRequired: { type: Boolean, default: true },
        cancellationPolicy: { type: String, default: '' },
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

    amenities: { type: String, default: '' },
    mealsIncluded: { type: Boolean, default: true },
    mealType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.MEAL_TYPES), default: PACKAGE.ACCOMMODATION.MEAL_TYPES.NO_MEALS },

    photos: [{ url: { type: String, default: '' }, type: { type: String, default: '' } }],
    seoMetadata: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: { type: String, default: '' }
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });

const SkiingSchema = new mongoose.Schema({
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    isActive: { type: Boolean, default: true },

    availability: {
        totalPasses: { type: Number, default: 0 },
        availablePasses: { type: Number, default: 0 },
        bookedPasses: { type: Number, default: 0 }
    },

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
        skiLiftPassIncluded: { type: Boolean, default: false }
    },

    timings: {
        reportingTime: { type: String, default: '09:00 AM' },
    },

    policies: {
        minAge: { type: Number, default: 0 },
        healthAdvisory: { type: String, default: '' },
        thingsToCarry: { type: String, default: '' },
        cancellationPolicy: { type: String, default: '' },
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

    amenities: { type: String, default: '' },
    mealsIncluded: { type: Boolean, default: true },
    mealType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.MEAL_TYPES), default: PACKAGE.ACCOMMODATION.MEAL_TYPES.NO_MEALS },

    photos: [{ url: { type: String, default: '' }, type: { type: String, default: '' } }],
    seoMetadata: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: { type: String, default: '' }
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });

const ParaglidingSchema = new mongoose.Schema({
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    isActive: { type: Boolean, default: true },

    availability: {
        totalFlights: { type: Number, default: 0 },
        availableFlights: { type: Number, default: 0 },
        bookedFlights: { type: Number, default: 0 },
        cancelledFlights: { type: Number, default: 0 }
    },

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
        pilotExperience: { type: String, default: '' },
        goproExcludedPrice: { type: Number, default: 0 }
    },

    timings: {
        departureTime: { type: String, default: '06:00 AM' },
        reportingTime: { type: String, default: '05:30 AM' },
    },

    policies: {
        minAge: { type: Number, default: 0 },
        maxWeightKg: { type: Number, default: 0 },
        healthAdvisory: { type: String, default: '' },
        cancellationPolicy: { type: String, default: '' },
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

    amenities: { type: String, default: '' },
    mealsIncluded: { type: Boolean, default: true },
    mealType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.MEAL_TYPES), default: PACKAGE.ACCOMMODATION.MEAL_TYPES.NO_MEALS },

    photos: [{ url: { type: String, default: '' }, type: { type: String, default: '' } }],
    seoMetadata: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: { type: String, default: '' }
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });

const CustomTripSchema = new mongoose.Schema({
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    isActive: { type: Boolean, default: true },

    availability: {
        totalSeats: { type: Number, default: 0 },
        availableSeats: { type: Number, default: 0 },
        bookedSeats: { type: Number, default: 0 }
    },

    pricing: {
        baseFare: optionalPriceWithDecimal,
        pricePerKm: optionalPriceWithDecimal,
        pricePerDay: optionalPriceWithDecimal,
        waitingChargePerHour: optionalPriceWithDecimal,
    },

    details: {
        serviceType: { type: String, enum: Object.values(PACKAGE.TRANSPORT.CUSTOM_TRIP_SERVICE_TYPES), default: PACKAGE.TRANSPORT.CUSTOM_TRIP_SERVICE_TYPES.POINT_TO_POINT },
        vehicleType: { type: String, enum: Object.values(PACKAGE.TRANSPORT.VEHICLE_TYPES), default: PACKAGE.TRANSPORT.VEHICLE_TYPES.BIKE },
        vehicleModel: { type: String, default: '' },
        isACAvailable: { type: Boolean, default: false },
        maxLuggageCapacity: { type: Number, default: 0 },
        operatingRadiusKm: { type: Number, default: 0 }
    },

    timings: {
        availableFrom: { type: String, default: '06:00 AM' },
        availableTo: { type: String, default: '10:00 PM' }
    },

    policies: {
        nightChargeApplicable: { type: Boolean, default: false },
        smokingAllowed: { type: Boolean, default: false },
        petFriendly: { type: Boolean, default: false },
        cancellationPolicy: { type: String, default: '' }
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

    photos: [{ url: { type: String, default: '' }, type: { type: String, default: '' } }],
    seoMetadata: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: { type: String, default: '' }
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });

const VendorPackageSchema = new mongoose.Schema({
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, unique: true },
    homestay: [HomestaySchema],
    hotel: [HotelSchema],
    camping: [CampingSchema],
    trekking: [TrekkingSchema],
    rafting: [RaftingSchema],
    bungeeJumping: [BungeeSchema],
    vehicleRental: [VehicleRentalSchema],
    chardhamTour: [ChardhamTourSchema],
    skiing: [SkiingSchema],
    paragliding: [ParaglidingSchema],
    customTrip: [CustomTripSchema],
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Package || mongoose.model('Package', VendorPackageSchema);
