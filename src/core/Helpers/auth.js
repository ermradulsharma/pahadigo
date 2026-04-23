import { DEFAULTS } from "@/core/Constants/index.js";
/**
 * Authentication Response Transformer (Backend)
 *
 * Standardizes the complete Authentication & Identity response structure
 * used across Login, OTP Verification, Social Auth, and Profile endpoints.
 *
 * @param {Object} result - The authentication result OR direct user object
 * @returns {Object} Standardized transformed payload
 */
export const transformAuthResponse = (result) => {
    if (!result) return DEFAULTS.NULL;

    // 1. Identify the core user object (handle nested {user} or direct object)
    const userSource = result.user || result;
    const user = userSource.toObject ? userSource.toObject() : userSource;

    // 2. Map Identity Meta (Fallbacks to user properties if missing from result root)
    return {
        ...user,
        token: result.token || undefined,
        role: result.role || user.role,
        isNewUser: result.isNewUser || DEFAULTS.FALSE,
        businessProfileStatus: result.businessProfileStatus || user.businessProfileStatus,
        businessProfile: result.businessProfile || user.businessProfile
    };
};

export default { transformAuthResponse };
