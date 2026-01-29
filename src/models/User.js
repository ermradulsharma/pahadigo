import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES, AUTH_PROVIDERS, USER_STATUS, DEFAULTS } from '../constants/index.js';

const UserSchema = new mongoose.Schema({
    name: { type: String, default: null },
    email: { type: String, lowercase: true, trim: true, default: null },
    phone: { type: String, trim: true, default: null },
    role: { type: String, enum: Object.values(USER_ROLES), default: DEFAULTS.USER_ROLE },
    password: { type: String, select: false },
    authProvider: { type: String, enum: Object.values(AUTH_PROVIDERS), default: DEFAULTS.AUTH_PROVIDER },
    googleId: { type: String, sparse: true, unique: true, default: null },
    facebookId: { type: String, sparse: true, unique: true, default: null },
    appleId: { type: String, sparse: true, unique: true, default: null },
    profileImage: { type: String, default: null },
    gender: { type: String, default: null },
    dateOfBirth: { type: Date, default: null },
    designation: { type: String, default: null },
    bio: { type: String, maxlength: 500, default: null },
    website: { type: String, default: null },
    socialLinks: {
        linkedin: { type: String, default: null },
        twitter: { type: String, default: null },
        instagram: { type: String, default: null },
        github: { type: String, default: null }
    },
    expertise: [{ type: String, default: null }],
    emergencyContact: {
        name: { type: String, default: null },
        phone: { type: String, default: null },
        relationship: { type: String, default: null }
    },
    address: {
        line1: { type: String, default: null },
        city: { type: String, default: null },
        state: { type: String, default: null },
        country: { type: String, default: DEFAULTS.COUNTRY },
        pincode: { type: String, default: null }
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
    lastLoginAt: { type: Date, default: null },
    termsAccepted: { type: Boolean, default: false },
    termsAcceptedAt: { type: Date, default: null },

    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedReason: { type: String, default: null },
}, {
    timestamps: true,
    toJSON: { virtuals: true, getters: true, minimize: false },
    toObject: { virtuals: true, getters: true, minimize: false }
});

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
