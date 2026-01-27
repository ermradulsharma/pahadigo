import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES, AUTH_PROVIDERS, USER_STATUS, DEFAULTS } from '../constants/index.js';

const UserSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: Object.values(USER_ROLES), default: DEFAULTS.USER_ROLE },
    password: { type: String, select: false },
    authProvider: { type: String, enum: Object.values(AUTH_PROVIDERS), default: DEFAULTS.AUTH_PROVIDER },
    googleId: { type: String, sparse: true, unique: true },
    facebookId: { type: String, sparse: true, unique: true },
    appleId: { type: String, sparse: true, unique: true },
    profileImage: { type: String },
    gender: { type: String },
    dateOfBirth: { type: Date },
    designation: { type: String },
    bio: { type: String, maxlength: 500 },
    website: { type: String },
    socialLinks: {
        linkedin: String,
        twitter: String,
        instagram: String,
        github: String
    },
    expertise: [{ type: String }],
    emergencyContact: {
        name: String,
        phone: String,
        relationship: String
    },
    address: {
        line1: String,
        city: String,
        state: String,
        country: { type: String, default: DEFAULTS.COUNTRY },
        pincode: String
    },
    preferences: {
        language: { type: String, default: DEFAULTS.LANGUAGE },
        notifications: {
            email: { type: Boolean, default: DEFAULTS.NOTIFICATIONS.EMAIL },
            sms: { type: Boolean, default: DEFAULTS.NOTIFICATIONS.SMS },
            push: { type: Boolean, default: DEFAULTS.NOTIFICATIONS.PUSH }
        }
    },

    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },

    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
    status: {
        type: String,
        enum: Object.values(USER_STATUS),
        default: DEFAULTS.USER_STATUS
    },
    lastLoginAt: Date,
    termsAcceptedAt: Date,

    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedReason: { type: String },
}, { timestamps: true });

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw err;
    }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.index(
    { email: 1 },
    {
        unique: true,
        partialFilterExpression: { email: { $exists: true, $ne: '' } }
    }
);

UserSchema.index(
    { phone: 1 },
    {
        unique: true,
        partialFilterExpression: { phone: { $exists: true, $ne: '' } }
    }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
