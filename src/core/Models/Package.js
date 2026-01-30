import mongoose from 'mongoose';

// --- Service Sub-Schemas ---

const HomestaySchema = new mongoose.Schema({
    roomType: { type: String, required: true },
    minGuestPerRoom: { type: Number, required: true },
    pricePerNight: { type: Number, required: true },
    mealsIncluded: { type: String }, // Array of strings (Breakfast, Dinner)
    location: { type: String, required: true },
    amenities: [{
        title: { type: String }
    }],
    photos: [{
        url: { type: String },
        type: { type: String }
    }],
    isActive: { type: Boolean, default: true }
});

const CampingSchema = new mongoose.Schema({
    campingType: { type: String, required: true },
    pricePerPerson: { type: Number, required: true },
    foodIncluded: { type: Boolean, default: false },
    activitiesIncluded: [{ type: String }],
    location: { type: String, required: true },
    photos: [{
        url: { type: String },
        type: { type: String }
    }],
    isActive: { type: Boolean, default: true }
});

const TrekkingSchema = new mongoose.Schema({
    trekkingName: { type: String, required: true },
    duration: { type: String, required: true },
    difficultyLevel: { type: String },
    bestSeason: { type: String },
    pricePerPerson: { type: Number, required: true },
    location: { type: String, required: true },
    amenities: [{
        title: { type: String }
    }],
    photos: [{
        url: { type: String },
        type: { type: String }
    }],
    isActive: { type: Boolean, default: true }
});

const RaftingSchema = new mongoose.Schema({
    stretchName: { type: String, required: true },
    distanceKm: { type: Number, required: true },
    duration: { type: String },
    difficultyLevel: { type: String },
    pricePerPerson: { type: Number, required: true },
    location: { type: String, required: true },
    amenities: [{
        title: { type: String }
    }],
    photos: [{
        url: { type: String },
        type: { type: String }
    }],
    isActive: { type: Boolean, default: true }
});

const BungeeSchema = new mongoose.Schema({
    jumpName: { type: String, required: true },
    heightMeters: { type: Number },
    minAge: { type: Number },
    maxWeightKg: { type: Number },
    pricePerPerson: { type: Number, required: true },
    location: { type: String, required: true },
    amenities: [{
        title: { type: String }
    }],
    photos: [{
        url: { type: String },
        type: { type: String }
    }],
    isActive: { type: Boolean, default: true }
});

const VehicleRentalSchema = new mongoose.Schema({
    vehicleType: { type: String, required: true }, // Bike, Car
    model: { type: String, required: true },
    pricePerDay: { type: Number, required: true },
    fuelPolicy: { type: String },
    location: { type: String, required: true },
    amenities: [{
        title: { type: String }
    }],
    photos: [{
        url: { type: String },
        type: { type: String }
    }],
    isActive: { type: Boolean, default: true }
});

const ChardhamTourSchema = new mongoose.Schema({
    tourName: { type: String, required: true },
    duration: { type: String, required: true },
    placesCovered: [{ type: String }],
    pricePerPerson: { type: Number, required: true },
    inclusions: { type: String },
    bestSeason: { type: String },
    amenities: [{
        title: { type: String }
    }],
    photos: [{
        url: { type: String },
        type: { type: String }
    }],
    isActive: { type: Boolean, default: true }
});


// --- Root Catalog Schema ---

const VendorPackageSchema = new mongoose.Schema({
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, unique: true },

    // Services Object containing arrays
    services: {
        homestay: [HomestaySchema],
        camping: [CampingSchema],
        trekking: [TrekkingSchema],
        rafting: [RaftingSchema],
        bungeeJumping: [BungeeSchema],
        vehicleRental: [VehicleRentalSchema],
        chardhamTour: [ChardhamTourSchema]
    },
    price: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Package || mongoose.model('Package', VendorPackageSchema);
