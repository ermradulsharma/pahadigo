import User from '@/core/Models/User.js';
import { USER_ROLES, VENDOR_STATUS } from '@/core/Constants/index.js';
import { addressPayload, getLocationPoint } from './addressHelper.js';
import { businessDetailsFormat, businessAuthResponse, closurePayload } from './businessHelper.js';
import { getBusinessBy } from './queryHelpers.js';

/**
 * Formats a User model instance into a standard user profile payload structure.
 * @param {Object} u - The User object (lean)
 * @returns {Object|null} Formatted user profile object or null
 */
export function userPayload(u) {
    if (!u) return null;
    const userId = u._id ? u._id.toString() : (u.id ? String(u.id) : null);
    if (!userId) return null;
    return {
        id: userId,
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
        experience: u.experience,
        designation: u.designation,
        bio: u.bio
    };
}

/**
 * Formats a User model instance into a lightweight user details structure.
 * @param {Object} u - The User object (lean)
 * @returns {Object|null} Formatted user details object or null
 */
export function userDetailsPayload(u) {
    if (!u) return null;
    const userId = u._id ? u._id.toString() : (u.id ? String(u.id) : null);
    if (!userId) return null;
    return {
        id: userId,
        name: u.name,
        email: u.email,
        phone: u.phone,
        profileImage: u.profileImage,
    };
}

/**
 * Shared helper to fetch a lean User model instance by User ID without password.
 * @param {String} id - The User ID
 * @returns {Promise<Object|null>} Lean User document or null
 */
async function fetchUserById(id) {
    if (!id) return null;
    return await User.findById(id).select('-password').lean();
}

/**
 * Fetches and formats a User profile by User ID.
 * @param {String} id - The User Id
 * @returns {Promise<Object|null>} Formatted user profile object or null
 */
export async function userProfileById(id) {
    const u = await fetchUserById(id);
    return userPayload(u);
}

/**
 * Fetches and formats a User profile along with Vendor business profile by User ID.
 * @param {String} id - The User Id
 * @returns {Promise<Object|null>} Formatted user profile with nested businessDetails or null
 */
export async function userBusinessProfileById(id) {
    const u = await fetchUserById(id);
    if (!u) return null;

    let vendor = null;
    if (u.role === USER_ROLES.VENDOR) {
        vendor = await getBusinessBy({ user: u._id });
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
    const baseUser = userPayload(u);
    if (!baseUser) return null;
    const businessDetails = businessDetailsFormat(vendor);
    return {
        ...baseUser,
        businessDetails
    };
}

/**
 * Formats a User model or Auth result object into a standardized authentication response structure.
 * @param {Object} user - The User object
 * @returns {Promise<Object|null>} Standardized user auth response object or null
 */
export async function userAuthResponse(user) {
    const baseUser = userPayload(user);
    if (!baseUser) return null;

    const business = await getBusinessBy({ user: baseUser.id });
    const businessData = businessAuthResponse(business);
    const businessProfileStatus = businessData ? businessData.profileStatus : (baseUser.role === USER_ROLES.TRAVELER ? null : VENDOR_STATUS.SET_PROFILE);

    return {
        ...baseUser,
        googleId: user.googleId,
        facebookId: user.facebookId,
        appleId: user.appleId,
        role: user.role,
        tempRole: user.preferences?.tempRole,
        tempExtraData: user.preferences?.tempExtraData,
        fcmToken: user.fcmToken,
        businessProfileStatus,
        businessProfile: businessData,
    };
}

export default {
    userPayload,
    userDetailsPayload,
    userProfileById,
    userBusinessProfileById,
    userBusinessPayload,
    userAuthResponse
};

