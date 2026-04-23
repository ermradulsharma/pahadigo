import roleMiddleware from '@/middleware/roleMiddleware.js';

describe('Industry Standard: roleMiddleware Logic', () => {
    it('[Success] should allow if user has allowed role', () => {
        const req = { user: { role: 'admin' } };
        const result = roleMiddleware(req, ['admin', 'vendor']);
        expect(result.authorized).toBe(true);
    });

    it('[Failure] should deny if user has incorrect role', () => {
        const req = { user: { role: 'traveller' } };
        const result = roleMiddleware(req, ['admin']);
        expect(result.authorized).toBe(false);
        expect(result.message).toContain('Admin');
    });

    it('[Failure] should deny if user is not authenticated', () => {
        const req = {};
        const result = roleMiddleware(req, ['admin']);
        expect(result.authorized).toBe(false);
        // Matching RESPONSE_MESSAGES.AUTH.UNAUTHORIZED
        expect(result.message).toContain('permission');
    });
});
