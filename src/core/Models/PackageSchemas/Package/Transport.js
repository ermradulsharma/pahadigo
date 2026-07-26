import mongoose from 'mongoose';
import { DEFAULTS } from '@/core/Constants/index.js';
import { TRANSPORT } from '@/core/Constants/Package/transport.js'
import { PointLocation } from '../BasePackageSchema.js'

export const ChardhamDetails = {
    bestSeason: { type: String, enum: Object.values(TRANSPORT.CHARDHAM_TOUR.BEST_SEASON), default: TRANSPORT.CHARDHAM_TOUR.BEST_SEASON.SUMMER },
    transportType: { type: String, enum: Object.values(TRANSPORT.CHARDHAM_TOUR.TRANSPORT_TYPE), default: TRANSPORT.CHARDHAM_TOUR.TRANSPORT_TYPE.NOT_INCLUDED },
    hotelType: { type: String, enum: Object.values(TRANSPORT.CHARDHAM_TOUR.HOTEL_TYPE), default: TRANSPORT.CHARDHAM_TOUR.HOTEL_TYPE.NOT_INCLUDED },
    duration: { type: String, default: DEFAULTS.NULL },
    inclusions: { type: String, default: DEFAULTS.NULL },
    exclusions: { type: String, default: DEFAULTS.NULL },
    departureTime: { type: String, default: DEFAULTS.NULL },
    reportingTime: { type: String, default: DEFAULTS.NULL },
    startPoint: PointLocation,
    endPoint: PointLocation,
}

export const BikeScooterRentalDetails = {
    vehicleName: { type: String, default: DEFAULTS.NULL },
    vehicleType: { type: String, enum: Object.values(TRANSPORT.BIKE_SCOOTER_RENTAL.TYPE), default: TRANSPORT.BIKE_SCOOTER_RENTAL.TYPE.BIKE }
}

export const CustomTripDetails = {
    serviceType: { type: String, enum: Object.values(TRANSPORT.CUSTOM_TRIP.SERVICE_TYPE), default: TRANSPORT.CUSTOM_TRIP.SERVICE_TYPE.POINT_TO_POINT },
    vehicleType: { type: String, enum: Object.values(TRANSPORT.CUSTOM_TRIP.VEHICLE_TYPE), default: TRANSPORT.CUSTOM_TRIP.VEHICLE_TYPE.BIKE },
    vehicleName: { type: String, default: DEFAULTS.NULL },
}