import mongoose from 'mongoose';
import HomestaySchema from './PackageSchemas/HomestaySchema.js';
import HotelSchema from './PackageSchemas/HotelSchema.js';
import CampingSchema from './PackageSchemas/CampingSchema.js';
import TrekkingSchema from './PackageSchemas/TrekkingSchema.js';
import RaftingSchema from './PackageSchemas/RaftingSchema.js';
import BungeeSchema from './PackageSchemas/BungeeSchema.js';
import VehicleRentalSchema from './PackageSchemas/VehicleRentalSchema.js';
import ChardhamTourSchema from './PackageSchemas/ChardhamTourSchema.js';
import SkiingSchema from './PackageSchemas/SkiingSchema.js';
import ParaglidingSchema from './PackageSchemas/ParaglidingSchema.js';
import CustomTripSchema from './PackageSchemas/CustomTripSchema.js';

const VendorPackageSchema = new mongoose.Schema({
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
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

// [PERFORMANCE] Compound Text Index for global search
VendorPackageSchema.index({
    'homestay.title': 'text',
    'hotel.title': 'text',
    'camping.title': 'text',
    'trekking.title': 'text',
    'rafting.title': 'text',
    'bungeeJumping.title': 'text',
    'vehicleRental.name': 'text',
    'chardhamTour.title': 'text',
    'skiing.title': 'text',
    'paragliding.title': 'text',
    'customTrip.title': 'text'
}, {
    name: 'PackageTextIndex',
    weights: {
        'trekking.title': 10,
        'homestay.title': 5,
        'hotel.title': 5
    }
});

// Avoid re-compilation of the model during HMR or multiple imports
export default mongoose.models.Package || mongoose.model('Package', VendorPackageSchema);
