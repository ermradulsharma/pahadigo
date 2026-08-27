import { addressPayload, getLocationPoint } from './addressHelper.js';
import { businessDetailsFormat, businessPayload, businessAuthResponse } from './businessHelper.js';

/**
 * Formats a User model instance into a standard user profile payload structure.
 * @param {Object} u - The User object (lean)
 * @returns {Object|null} Formatted user profile object or null
 */
export function userPayload(u) {
    if (!u) return null;

    return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone,
        profileImage: u.profileImage,
        gender: u.gender,
        dateOfBirth: u.dateOfBirth ? (typeof u.dateOfBirth === 'string' ? u.dateOfBirth : new Date(u.dateOfBirth).toISOString().split('T')[0]) : '',
        address: addressPayload(u.address),
        location: getLocationPoint(u.address),
        rating: u.rating,
        experience: u.experience,
        designation: u.designation
    };
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

export { businessDetailsFormat, businessPayload, businessAuthResponse };
export default { userPayload, userBusinessPayload, userAuthResponse, businessDetailsFormat, businessPayload, addressPayload, getLocationPoint, businessAuthResponse };
