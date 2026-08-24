/**
 * Vendor & Business Payload Formatting Helpers
 */

/**
 * Formats a structured address object into a clean, comma-separated single-line string.
 * @param {Object|string} addr - Address object or string
 * @returns {string} Single-line address string
 */
export const addressPayload = (addr) => {
    if (!addr) return '';
    if (typeof addr === 'string') return addr.trim();
    const rawParts = [addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.country, addr.pincode];
    const validParts = rawParts.filter(p => p !== null && p !== undefined).map(p => String(p).trim()).filter(p => p.length > 0 && p.toLowerCase() !== 'null' && p.toLowerCase() !== 'undefined');
    return validParts.join(', ');
};

/**
 * Extracts GeoJSON Location Point object from address details.
 * @param {Object} addr - Address object containing location or latitude/longitude
 * @returns {Object|null} GeoJSON Point object or null
 */
export const getLocationPoint = (addr) => {
    if (!addr || typeof addr !== 'object') return null;
    if (addr.location && Array.isArray(addr.location.coordinates) && addr.location.coordinates.length === 2) {
        return {
            type: addr.location.type || 'Point',
            coordinates: addr.location.coordinates
        };
    }
    const lat = parseFloat(addr.latitude);
    const lng = parseFloat(addr.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
        return {
            type: 'Point',
            coordinates: [lng, lat]
        };
    }
    return null;
};

/**
 * Formats a User model instance into a standard user profile payload structure.
 * @param {Object} u - The User object (lean)
 * @returns {Object|null} Formatted user profile object or null
 */
export const userPayload = (u) => {
    if (!u) return null;
    return {
        id: u._id ? u._id.toString() : (u.id || ''),
        name: u.name || '',
        email: u.email || '',
        phone: u.phone || '',
        experience: typeof u.experience === 'number' ? `${u.experience} years` : (u.experience || ''),
        designation: u.designation || '',
        dateOfBirth: u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().split('T')[0] : '',
        address: addressPayload(u.address),
        location: getLocationPoint(u.address),
        profileImage: u.profileImage || '',
        rating: u.rating || 0,
    };
};

/**
 * Formats a raw vendor document into clean business details object without nested personalProfile.
 * @param {Object} vendor - The Vendor object (lean)
 * @returns {Object|null} Business details object or null
 */
export const businessDetailsFormat = (vendor) => {
    if (!vendor) return null;
    return {
        id: vendor._id ? vendor._id.toString() : (vendor.id || ''),
        ownerName: vendor.ownerName || '',
        businessName: vendor.businessName || '',
        businessNumber: vendor.businessNumber || '',
        businessRegistration: vendor.businessRegistration || '',
        gstNumber: vendor.gstNumber || '',
        address: addressPayload(vendor.address),
        location: getLocationPoint(vendor.address),
        profileImage: vendor.profileImage || '',
        profileType: vendor.profileType || 'business',
        trustBadge: vendor.trustBadge || 'none',
        businessAbout: vendor.businessAbout || '',
        createdAt: vendor.createdAt || null
    };
};

/**
 * Formats a vendor model (with populated user) into standard business API response structure.
 * @param {Object} vendor - The vendor object (lean, with populated user)
 * @returns {Object|null} Formatted business object or null
 */
export const businessPayload = (vendor) => {
    if (!vendor) return null;
    const u = typeof vendor.user === 'object' && vendor.user !== null ? vendor.user : null;
    const b = businessDetailsFormat(vendor);
    if (!b) return null;

    return {
        ...b,
        personalProfile: userPayload(u)
    };
};

/**
 * Formats a User model and optional Vendor/Business into an inverted (User-first) response payload with nested businessDetails.
 * @param {Object} u - The User object (lean)
 * @param {Object} vendor - The Vendor object (lean)
 * @returns {Object|null} User-centric payload with businessDetails or null
 */
export const userBusinessPayload = (u, vendor = null) => {
    if (!u) return null;
    const baseUser = userPayload(u);
    if (!baseUser) return null;

    return {
        ...baseUser,
        businessDetails: businessDetailsFormat(vendor)
    };
};

export default {
    businessPayload,
    userPayload,
    userBusinessPayload,
    businessDetailsFormat,
    addressPayload,
    getLocationPoint
};
