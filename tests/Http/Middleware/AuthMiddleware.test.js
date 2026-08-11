import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Helpers/jwt.js', () => ({
    verifyToken: jest.fn(),
    generateToken: jest.fn(),
    generateAuthTokens: jest.fn(),
    decodeToken: jest.fn()
}));

jest.unstable_mockModule('@/core/Models/User.js', () => ({
    default: { findById: jest.fn() }
}));

const { default: authMiddleware } = await import('@/middleware/auth.js');
const { verifyToken } = await import('@/core/Helpers/jwt.js');
const { default: User } = await import('@/core/Models/User.js');

describe('Core Middleware: Auth', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Success] should allow authorized requests with valid token and active user', async () => {
        const req = { headers: { get: (name) => name === 'authorization' ? 'Bearer valid-token' : null } };
        verifyToken.mockResolvedValue({ id: 'u1' });
        User.findById.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue({ _id: 'u1', status: 'active' })
            })
        });

        const result = await authMiddleware(req);

        expect(result.authorized).toBe(true);
        expect(result.user.id).toBe('u1');
    });

    it('[Failure] should deny if no token provided', async () => {
        const req = { headers: { get: () => null } };
        const result = await authMiddleware(req);
        expect(result.authorized).toBe(false);
        expect(result.message).toContain('header is missing');
    });

    it('[Failure] should deny if user is blocked', async () => {
        const req = { headers: { get: (name) => name === 'authorization' ? 'Bearer valid-token' : null } };
        verifyToken.mockResolvedValue({ id: 'u1' });
        User.findById.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue({ _id: 'u1', status: 'blocked' })
            })
        });

        const result = await authMiddleware(req);
        expect(result.authorized).toBe(false);
        expect(result.message).toContain('blocked');
    });
});
