import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: ['admin', 'vendor', 'traveller'], default: 'traveller' },
    password: { type: String, select: false },
    authProvider: { type: String, enum: ['local', 'google', 'phone', 'facebook', 'apple'], default: 'phone' },
    googleId: { type: String, sparse: true, unique: true },
    facebookId: { type: String, sparse: true, unique: true },
    appleId: { type: String, sparse: true, unique: true },
    profileImage: { type: String },
    gender: { type: String },
    dateOfBirth: { type: Date },
    address: {
        line1: String,
        city: String,
        state: String,
        country: { type: String, default: 'India' },
        pincode: String
    },
    preferences: {
        language: { type: String, default: 'en' },
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: true },
            push: { type: Boolean, default: true }
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
        enum: ['pending', 'active', 'blocked'],
        default: 'pending'
    },
    lastLoginAt: Date,
    termsAcceptedAt: Date,

    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedReason: { type: String },
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
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
