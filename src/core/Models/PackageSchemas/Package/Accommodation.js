import mongoose from 'mongoose';
import { DEFAULTS } from '@/core/Constants/index.js';
import { ACCOMMODATION } from '@/core/Constants/Package/accommodation.js';
import { PACKAGE } from '@/core/Constants/Package/package.js';
import { range } from '../BasePackageSchema.js';

export const HomestayDetails = {
    type: { type: String, enum: Object.values(ACCOMMODATION.HOMESTAY.TYPE), default: ACCOMMODATION.HOMESTAY.TYPE.COTTAGE },
    roomType: { type: String, enum: Object.values(ACCOMMODATION.HOMESTAY.ROOM_TYPE), default: ACCOMMODATION.HOMESTAY.ROOM_TYPE.STANDARD },
    bedType: { type: String, enum: Object.values(ACCOMMODATION.COMMON.BED_TYPE), default: ACCOMMODATION.COMMON.BED_TYPE.DOUBLE },
    rentalType: { type: String, enum: Object.values(ACCOMMODATION.HOMESTAY.RENTAL_TYPE), default: ACCOMMODATION.HOMESTAY.RENTAL_TYPE.PRIVATE_ROOM },
    bathroomType: { type: String, enum: Object.values(PACKAGE.BATHROOM_TYPE), default: PACKAGE.BATHROOM_TYPE.PRIVATE },
    checkInTime: { type: String, default: DEFAULTS.NULL },
    checkOutTime: { type: String, default: DEFAULTS.NULL },
};

export const HotelDetails = {
    type: { type: String, enum: Object.values(ACCOMMODATION.HOTEL.TYPE), default: ACCOMMODATION.HOTEL.TYPE.BUDGET },
    roomType: { type: String, enum: Object.values(ACCOMMODATION.HOTEL.ROOM_TYPE), default: ACCOMMODATION.HOTEL.ROOM_TYPE.STANDARD },
    bedType: { type: String, enum: Object.values(ACCOMMODATION.COMMON.BED_TYPE), default: ACCOMMODATION.COMMON.BED_TYPE.DOUBLE },
    bathroomType: { type: String, enum: Object.values(PACKAGE.BATHROOM_TYPE), default: PACKAGE.BATHROOM_TYPE.PRIVATE },
    checkInTime: { type: String, default: DEFAULTS.NULL },
    checkOutTime: { type: String, default: DEFAULTS.NULL },
};

export const CampingDetails = {
    type: { type: String, enum: Object.values(ACCOMMODATION.CAMPING.TYPE), default: ACCOMMODATION.CAMPING.TYPE.TENT },
    bathroomType: { type: String, enum: Object.values(PACKAGE.BATHROOM_TYPE), default: PACKAGE.BATHROOM_TYPE.PRIVATE },
    isElectricity: { type: Boolean, default: DEFAULTS.FALSE },
    checkInTime: { type: String, default: DEFAULTS.NULL },
    checkOutTime: { type: String, default: DEFAULTS.NULL },
    age: range,
};