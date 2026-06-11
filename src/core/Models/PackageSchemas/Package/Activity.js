import mongoose from 'mongoose';
import { DEFAULTS } from '@/core/Constants/index.js';
import { ACTIVITY } from '@/core/Constants/Package/activity.js'
import { range, PointLocation } from '../BasePackageSchema.js';

export const BungeeJumpingDetails = {
    type: { type: String, enum: Object.values(ACTIVITY.BUNGEE_JUMPING.JUMP_TYPE), default: ACTIVITY.BUNGEE_JUMPING.JUMP_TYPE.FORWARD },
    height: range,
    weight: range,
    age: range,
    departureTime: { type: String, default: DEFAULTS.NULL },
    reportingTime: { type: String, default: DEFAULTS.NULL },
    duration: { type: String, default: DEFAULTS.NULL },
    inclusions: { type: String, default: DEFAULTS.NULL },
    exclusions: { type: String, default: DEFAULTS.NULL },
}

export const RaftingDetails = {
    type: { type: String, enum: Object.values(ACTIVITY.RAFTING.TYPE), default: ACTIVITY.RAFTING.TYPE.RIVERSIDE },
    difficulty: { type: String, enum: Object.values(ACTIVITY.RAFTING.DIFFICULTY), default: ACTIVITY.RAFTING.DIFFICULTY.EASY },
    grade: { type: String, enum: Object.values(ACTIVITY.RAFTING.RAPIDGRADE), default: ACTIVITY.RAFTING.RAPIDGRADE.I },
    distance: { type: String, default: DEFAULTS.NULL },
    duration: { type: String, default: DEFAULTS.NULL },
    size: { type: Number, default: DEFAULTS.COUNTS.ZERO },
    inclusions: { type: String, default: DEFAULTS.NULL },
    exclusions: { type: String, default: DEFAULTS.NULL },
    departureTime: { type: String, default: DEFAULTS.NULL },
    reportingTime: { type: String, default: DEFAULTS.NULL },
    age: range,
    startPoint: PointLocation,
    endPoint: PointLocation,
}

export const TrekkingDetails = {
    type: { type: String, enum: Object.values(ACTIVITY.TREKKING.TYPE), default: ACTIVITY.TREKKING.TYPE.DAY_TREK },
    difficulty: { type: String, enum: Object.values(ACTIVITY.TREKKING.DIFFICULTY), default: ACTIVITY.TREKKING.DIFFICULTY.EASY },
    fitness: { type: String, enum: Object.values(ACTIVITY.TREKKING.FITNESS), default: ACTIVITY.TREKKING.FITNESS.BASIC },
    season: { type: String, enum: Object.values(ACTIVITY.TREKKING.SEASON), default: ACTIVITY.TREKKING.SEASON.ALLYEAR },
    maxAltitude: { type: String, default: DEFAULTS.NULL },
    distance: { type: String, default: DEFAULTS.NULL },
    duration: { type: String, default: DEFAULTS.NULL },
    inclusions: { type: String, default: DEFAULTS.NULL },
    exclusions: { type: String, default: DEFAULTS.NULL },
    departureTime: { type: String, default: DEFAULTS.NULL },
    reportingTime: { type: String, default: DEFAULTS.NULL },
    age: range,
    startPoint: PointLocation,
    endPoint: PointLocation,
}