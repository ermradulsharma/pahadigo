import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Constants/index.js', () => ({
    STATUS: { DELETED: 'deleted', BLOCKED: 'blocked', SUSPENDED: 'suspended' },
    RESPONSE_MESSAGES: {
        AUTH: {
            NO_TOKEN: 'No token',
            TOKEN_INVALID: 'Token invalid',
            ACCOUNT_DELETED: 'Account deleted',
            ACCOUNT_BLOCKED: 'Account blocked',
            ACCOUNT_SUSPENDED: 'Account suspended',
            AUTH_SERVICE_ERROR: 'Auth error'
        }
    },
    DEFAULTS: { TRUE: true, FALSE: false }
}));

jest.unstable_mockModule('@/core/Helpers/jwt.js', () => ({
    verifyToken: jest.fn()
}));

jest.unstable_mockModule('@/core/Models/User.js', () => ({
    default: {
        findById: jest.fn()
    }
}));

const { default: authMiddleware } = await import('@/core/Http/Middleware/auth.js');
const { verifyToken } = await import('@/core/Helpers/jwt.js');
const { default: User } = await import('@/core/Models/User.js');

describe('Auth Middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const createRequest = (authHeader) => ({
        headers: { get: () => authHeader }
    });

    it('should return NO_TOKEN if header is missing', async () => {
        const result = await authMiddleware(createRequest(null));
        expect(result).toEqual({ authorized: false, message: 'No token' });
    });

    it('should return TOKEN_INVALID if token verification fails', async () => {
        verifyToken.mockResolvedValue(null);
        const result = await authMiddleware(createRequest('Bearer invalidToken'));
        expect(result).toEqual({ authorized: false, message: 'Token invalid' });
    });

    it('should return ACCOUNT_DELETED if user not found', async () => {
        verifyToken.mockResolvedValue({ id: 'u1' });
        User.findById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) });
        const result = await authMiddleware(createRequest('Bearer token'));
        expect(result).toEqual({ authorized: false, message: 'Account deleted' });
    });

    it('should return ACCOUNT_BLOCKED if user is blocked', async () => {
        verifyToken.mockResolvedValue({ id: 'u1' });
        User.findById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ status: 'blocked' }) }) });
        const result = await authMiddleware(createRequest('Bearer token'));
        expect(result).toEqual({ authorized: false, message: 'Account blocked' });
    });

    it('should return user if authorized', async () => {
        verifyToken.mockResolvedValue({ id: 'u1' });
        User.findById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: { toString: () => 'u1' }, status: 'active' }) }) });
        const result = await authMiddleware(createRequest('Bearer token'));
        expect(result.authorized).toBe(true);
        expect(result.user.id).toBe('u1');
    });

    it('should handle thrown errors gracefully', async () => {
        verifyToken.mockRejectedValue(new Error('crash'));
        const result = await authMiddleware(createRequest('Bearer token'));
        expect(result).toEqual({ authorized: false, message: 'Auth error' });
    });
});
