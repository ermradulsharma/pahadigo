import { userPayload } from './userProfileHelper.js';
import { addressPayload, getLocationPoint } from './addressHelper.js';
import { VENDOR_STATUS } from '@/core/Constants/index.js';

/**
 * Formats a raw vendor document into clean business details object without nested personalProfile.
 * @param {Object} vendor - The Vendor object (lean)
 * @returns {Object|null} Business details object or null
 */
export function businessDetailsFormat(vendor) {
    if (!vendor) return null;
    return {
        id: vendor._id.toString(),
        ownerName: vendor.ownerName,
        businessName: vendor.businessName,
        businessNumber: vendor.businessNumber,
        businessRegistration: vendor.businessRegistration,
        gstNumber: vendor.gstNumber,
        address: addressPayload(vendor.address),
        location: getLocationPoint(vendor.address),
        profileImage: vendor.profileImage,
        profileType: vendor.profileType,
        businessAbout: vendor.businessAbout,
        trustBadge: vendor.trustBadge,
        isOperating: vendor.isOperating,
        closurePeriods: vendor.closurePeriods || [],
        status: vendor.status,
        createdAt: vendor.createdAt
    };
}

/**
 * Formats a vendor model (with populated user) into standard business API response structure.
 * @param {Object} vendor - The vendor object (lean, with populated user)
 * @returns {Object|null} Formatted business object or null
 */
export function businessPayload(vendor) {
    if (!vendor) return null;
    const u = typeof vendor.user === 'object' && vendor.user !== null ? vendor.user : null;
    const b = businessDetailsFormat(vendor);
    if (!b) return null;
    return { ...b, personalProfile: userPayload(u) };
}

/**
 * Formats a vendor document into authentication response payload.
 * @param {Object} vendor - The vendor object
 * @returns {Object|null} Formatted business auth response object or null
 */
export function businessAuthResponse(vendor) {
    const base = businessDetailsFormat(vendor);
    if (!base) return null;

    let profileStatus = VENDOR_STATUS.UPLOAD_DOCUMENTS;
    if (vendor.documents?.aadharCard?.length > 0 && vendor.documents?.panCard?.url) profileStatus = VENDOR_STATUS.COMPLETED;
    return { ...base, isApproved: vendor.isApproved, isOperating: vendor.isOperating, status: vendor.status, profileStatus };
}

export default { addressPayload, getLocationPoint, businessDetailsFormat, businessPayload, businessAuthResponse };
