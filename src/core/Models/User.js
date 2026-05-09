import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES, AUTH_PROVIDERS, STATUS, DEFAULTS, GENDER } from '../Constants/index.js';

const UserSchema = new mongoose.Schema({
  // ============================================
  // 1. IDENTITY & AUTHENTICATION
  // ============================================
  name: { type: String, trim: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  email: { type: String, lowercase: DEFAULTS.TRUE, trim: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  phone: { type: String, trim: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  role: { type: String, enum: Object.values(USER_ROLES), default: DEFAULTS.USER_ROLE },
  password: { type: String, select: DEFAULTS.FALSE, default: DEFAULTS.NULL },
  authProvider: { type: String, enum: Object.values(AUTH_PROVIDERS), default: DEFAULTS.AUTH_PROVIDER },
  googleId: { type: String, default: DEFAULTS.NULL },
  facebookId: { type: String, default: DEFAULTS.NULL },
  appleId: { type: String, default: DEFAULTS.NULL },

  // ============================================
  // 2. PERSONAL PROFILE
  // ============================================
  profileImage: { type: String, default: DEFAULTS.NULL },
  gender: { type: String, enum: Object.values(GENDER), default: DEFAULTS.NULL },
  dateOfBirth: { type: Date, default: DEFAULTS.NULL },
  bloodGroup: { type: String, default: DEFAULTS.NULL },
  medicalConditions: { type: [String], default: DEFAULTS.ARRAY },
  bio: { type: String, default: DEFAULTS.NULL },

  // ============================================
  // 3. PROFESSIONAL INFO
  // ============================================
  experience: { type: Number, default: 0 },
  designation: { type: String, default: DEFAULTS.NULL },
  website: { type: String, default: DEFAULTS.NULL },
  expertise: [{ type: String, default: DEFAULTS.NULL }],

  // ============================================
  // 4. SOCIAL CONNECTIVITY
  // ============================================
  socialLinks: {
    twitter: { type: String, default: DEFAULTS.NULL },
    instagram: { type: String, default: DEFAULTS.NULL },
    youtube: { type: String, default: DEFAULTS.NULL },
    whatsapp: { type: String, default: DEFAULTS.NULL },
    telegram: { type: String, default: DEFAULTS.NULL },
    snapchat: { type: String, default: DEFAULTS.NULL },
    tiktok: { type: String, default: DEFAULTS.NULL },
    other: { type: String, default: DEFAULTS.NULL },
  },

  // ============================================
  // 5. SAFETY & EMERGENCY
  // ============================================
  emergencyContacts: [{
    name: { type: String, required: DEFAULTS.TRUE, default: DEFAULTS.NULL },
    phone: { type: String, required: DEFAULTS.TRUE, default: DEFAULTS.NULL },
    relationship: { type: String, default: DEFAULTS.NULL }
  }],

  // ============================================
  // 6. ADDRESS & GEO-LOCATION
  // ============================================
  address: {
    addressLine1: { type: String, default: DEFAULTS.NULL },
    addressLine2: { type: String, default: DEFAULTS.NULL },
    city: { type: String, default: DEFAULTS.NULL },
    state: { type: String, default: DEFAULTS.NULL },
    country: { type: String, default: DEFAULTS.COUNTRY },
    pincode: { type: String, default: DEFAULTS.NULL },
    latitude: { type: String, default: DEFAULTS.NULL },
    longitude: { type: String, default: DEFAULTS.NULL },
    location: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    }
  },

  // ============================================
  // 7. PREFERENCES & SETTINGS
  // ============================================
  preferences: {
    language: { type: String, default: DEFAULTS.LANGUAGE },
    notifications: {
      email: { type: Boolean, default: DEFAULTS.NOTIFICATIONS.EMAIL },
      sms: { type: Boolean, default: DEFAULTS.NOTIFICATIONS.SMS },
      push: { type: Boolean, default: DEFAULTS.NOTIFICATIONS.PUSH },
      whatsapp: { type: Boolean, default: DEFAULTS.NOTIFICATIONS.WHATSAPP }
    },
    tempRole: { type: String, default: DEFAULTS.NULL },
    tempExtraData: { type: mongoose.Schema.Types.Mixed, default: DEFAULTS.NULL }
  },

  // ============================================
  // 8. BUSINESS & VENDOR DETAILS
  // ============================================
  isVendorVerified: { type: Boolean, default: DEFAULTS.FALSE },
  vendorProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: DEFAULTS.NULL },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },

  // ============================================
  // 9. SYSTEM & METADATA
  // ============================================
  fcmToken: { type: String, default: DEFAULTS.NULL },
  otp: { type: String, select: DEFAULTS.FALSE, default: DEFAULTS.NULL },
  otpExpires: { type: Date, select: DEFAULTS.FALSE, default: DEFAULTS.NULL },
  isVerified: { type: Boolean, default: DEFAULTS.FALSE },
  status: { type: String, enum: Object.values(STATUS), default: DEFAULTS.STATUS },
  lastLoginAt: { type: Date, default: DEFAULTS.NULL },
  termsAccepted: { type: Boolean, default: DEFAULTS.FALSE },
  termsAcceptedAt: { type: Date, default: DEFAULTS.NULL },
  deletedAt: { type: Date, default: DEFAULTS.NULL },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: DEFAULTS.NULL },
  deletedReason: { type: String, default: DEFAULTS.NULL },
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
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

UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: "string" } } });
UserSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $type: "string" } } });
UserSchema.index({ googleId: 1 }, { unique: true, partialFilterExpression: { googleId: { $type: "string" } } });
UserSchema.index({ facebookId: 1 }, { unique: true, partialFilterExpression: { facebookId: { $type: "string" } } });
UserSchema.index({ appleId: 1 }, { unique: true, partialFilterExpression: { appleId: { $type: "string" } } });
UserSchema.index({ "address.location": "2dsphere" });
UserSchema.index({ status: 1 });
UserSchema.index({ role: 1 });

if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model('User', UserSchema);
