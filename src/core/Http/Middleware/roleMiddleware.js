import { USER_ROLES, RESPONSE_MESSAGES, DEFAULTS } from '@/core/Constants/index.js';

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
        return { authorized: DEFAULTS.FALSE, message: RESPONSE_MESSAGES.AUTH.UNAUTHORIZED };
    }
    let role = req.user.role;
    if (req.user.preferences?.tempRole) {
        role = req.user.preferences?.tempRole;
    }


    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        let errorMessage = RESPONSE_MESSAGES.ERROR.FORBIDDEN;
        if (allowedRoles.includes(USER_ROLES.ADMIN) && allowedRoles.length === 1) {
            errorMessage = RESPONSE_MESSAGES.AUTH.ADMIN_ONLY;
        }
        return { authorized: DEFAULTS.FALSE, message: errorMessage };
    }
    return { authorized: DEFAULTS.TRUE };
};

export default roleMiddleware;
