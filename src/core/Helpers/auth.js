import { userAuthResponse } from './userProfileHelper.js';
import { businessAuthResponse } from './businessHelper.js';
import { VENDOR_STATUS } from '@/core/Constants/index.js';

/**
 * Authentication Response Transformer (Backend)
 * Standardizes the complete Authentication & Identity response structure
 * used across Login, OTP Verification, Social Auth, and Profile endpoints.
 *
 * @param {Object} result - The authentication result OR direct user object
 * @returns {Object} Standardized transformed payload
 */
export const transformAuthResponse = (result) => {
    if (!result) return null;
    return { ...result };
};

export default { transformAuthResponse };
