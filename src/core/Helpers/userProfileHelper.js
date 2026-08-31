import User from '@/core/Models/User.js';
import Vendor from '@/core/Models/Vendor.js';
import { USER_ROLES } from '@/core/Constants/index.js';
import { addressPayload, getLocationPoint } from './addressHelper.js';
import { businessDetailsFormat, businessPayload, businessAuthResponse } from './businessHelper.js';

/**
 * Formats a User model instance into a standard user profile payload structure.
 * @param {Object} u - The User object (lean)
 * @returns {Object|null} Formatted user profile object or null
 */
export function userPayload(u) {
    if (!u || !u._id) return null;
    return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone,
        profileImage: u.profileImage,
        gender: u.gender,
        dateOfBirth: u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().split('T')[0] : null,
        address: addressPayload(u.address),
        location: getLocationPoint(u.address),
        rating: u.rating,
        status: u.status,
        isVerified: u.isVerified,
        ...(u.role === USER_ROLES.VENDOR ? {
            experience: u.experience,
            designation: u.designation,
            bio: u.bio
        } : {
            emergencyContacts: u.emergencyContacts,
            medicalConditions: u.medicalConditions,
            bloodGroup: u.bloodGroup
        })
    }
};


/**
 * Fetches and formats a User profile by User ID.
 * @param {String} id - The User Id
 * @returns {Promise<Object|null>} Formatted user profile object or null
 */
export async function userProfileById(id) {
    if (!id) return null;
    const u = await User.findById(id).select('-password').lean();
    return userPayload(u);
}

/**
 * Fetches and formats a User profile along with Vendor business profile by User ID.
 * @param {String} id - The User Id
 * @returns {Promise<Object|null>} Formatted user profile with nested businessDetails or null
 */
export async function userBusinessProfileById(id) {
    if (!id) return null;
    const u = await User.findById(id).select('-password').lean();
    if (!u) return null;

    let vendor = null;
    if (u.role === USER_ROLES.VENDOR) {
        vendor = await Vendor.findOne({ user: u._id }).lean();
    }
    return userBusinessPayload(u, vendor);
}

/**
 * Formats a User model and optional Vendor/Business into an inverted (User-first) response payload with nested businessDetails.
 * @param {Object} u - The User object (lean)
 * @param {Object} vendor - The Vendor object (lean)
 * @returns {Object|null} User-centric payload with businessDetails or null
 */
export function userBusinessPayload(u, vendor = null) {
    if (!u) return null;
    const baseUser = userPayload(u);
    if (!baseUser) return null;
    return { ...baseUser, businessDetails: businessDetailsFormat(vendor) };
}

/**
 * Formats a User model or Auth result object into a standardized authentication response structure.
 * @param {Object} user - The User object
 * @returns {Object|null} Standardized user auth response object or null
 */
export function userAuthResponse(user) {
    const baseUser = userPayload(user);
    if (!baseUser) return null;

    return {
        ...baseUser,
        googleId: user.googleId,
        facebookId: user.facebookId,
        appleId: user.appleId,
        role: user.role,
        tempRole: user.preferences?.tempRole,
        tempExtraData: user.preferences?.tempExtraData,
        bio: user.bio,
        isVerified: Boolean(user.isVerified),
        status: user.status,
        fcmToken: user.fcmToken
    };
}

export { userPayload, userProfileById, userBusinessProfileById, userBusinessPayload, userAuthResponse, businessDetailsFormat, businessPayload, businessAuthResponse };

export default { userPayload, userProfileById, userBusinessProfileById, userBusinessPayload, userAuthResponse, businessDetailsFormat, businessPayload, addressPayload, getLocationPoint, businessAuthResponse };
