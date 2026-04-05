import { roleMiddleware } from '../../../src/core/Http/Middleware/roleMiddleware.js';
import { USER_ROLES, RESPONSE_MESSAGES } from '../../../src/core/Constants/index.js';

describe('RoleMiddleware Test Suite', () => {
    it('should return authorized for user with correct role', () => {
        const req = { user: { role: USER_ROLES.VENDOR } };
        const result = roleMiddleware(req, [USER_ROLES.VENDOR]);
        expect(result.authorized).toBe(true);
    });

    it('should block if user has wrong role', () => {
        const req = { user: { role: USER_ROLES.TRAVELLER } };
        const result = roleMiddleware(req, [USER_ROLES.ADMIN]);
        expect(result.authorized).toBe(false);
        expect(result.message).toBe(RESPONSE_MESSAGES.AUTH.ADMIN_ONLY);
    });

    it('should block if no user is present', () => {
        const req = {};
        const result = roleMiddleware(req, [USER_ROLES.ADMIN]);
        expect(result.authorized).toBe(false);
    });
});
