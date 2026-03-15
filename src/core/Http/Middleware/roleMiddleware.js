import { USER_ROLES, RESPONSE_MESSAGES } from '@/constants/index.js';

/**
 * Validates if the authenticated user has the required role.
 * This should be called after `authMiddleware` has populated `req.user`.
 * 
 * @param {Object} req - The request object (must contain req.user)
 * @param {Array<string>} allowedRoles - Roles allowed to access the resource
 * @returns {Object} { authorized: boolean, message?: string }
 */
export const roleMiddleware = (req, allowedRoles = []) => {
    if (!req.user) {
        return { authorized: false, message: RESPONSE_MESSAGES.AUTH.UNAUTHORIZED };
    }

    // If roles are specified, check if the user's role is in the allowed list
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        let errorMessage = RESPONSE_MESSAGES.ERROR.FORBIDDEN;
        
        // Provide specific error messages based on the requested role type
        if (allowedRoles.includes(USER_ROLES.ADMIN) && allowedRoles.length === 1) {
            errorMessage = RESPONSE_MESSAGES.AUTH.ADMIN_ONLY;
        } else if (allowedRoles.includes(USER_ROLES.VENDOR) && allowedRoles.length === 1) {
            errorMessage = RESPONSE_MESSAGES.AUTH.VENDORS_ONLY;
        }

        return { authorized: false, message: errorMessage };
    }

    return { authorized: true };
};

export default roleMiddleware;
