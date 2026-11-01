import { jest } from '@jest/globals';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';

jest.unstable_mockModule('@/core/Services/CacheService.js', () => ({
    default: {
        get: jest.fn().mockResolvedValue(null)
    }
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
        expect(result).toEqual({ authorized: false, message: RESPONSE_MESSAGES.AUTH.NO_TOKEN });
    });

    it('should return TOKEN_INVALID if token verification fails', async () => {
        verifyToken.mockResolvedValue(null);
        const result = await authMiddleware(createRequest('Bearer invalidToken'));
        expect(result).toEqual({ authorized: false, message: RESPONSE_MESSAGES.AUTH.TOKEN_INVALID });
    });

    it('should return ACCOUNT_DELETED if user not found', async () => {
        verifyToken.mockResolvedValue({ id: 'u1' });
        User.findById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) });
        const result = await authMiddleware(createRequest('Bearer token'));
        expect(result).toEqual({ authorized: false, message: RESPONSE_MESSAGES.AUTH.ACCOUNT_DELETED });
    });

    it('should return ACCOUNT_BLOCKED if user is blocked', async () => {
        verifyToken.mockResolvedValue({ id: 'u1' });
        User.findById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ status: 'blocked' }) }) });
        const result = await authMiddleware(createRequest('Bearer token'));
        expect(result).toEqual({ authorized: false, message: RESPONSE_MESSAGES.AUTH.ACCOUNT_BLOCKED });
    });

    it('should return user if authorized', async () => {
        verifyToken.mockResolvedValue({ id: 'u1' });
        User.findById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: { toString: () => 'u1' }, status: 'active' }) }) });
        const result = await authMiddleware(createRequest('Bearer token'));
        expect(result.authorized).toBe(true);
        expect(result.user.id).toBe('u1');
    });

    it('should return user if authorized with query parameter token (SSE / EventSource)', async () => {
        verifyToken.mockResolvedValue({ id: 'u1' });
        User.findById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: { toString: () => 'u1' }, status: 'active' }) }) });
        const req = {
            headers: { get: () => null },
            url: 'http://localhost:3000/api/admin/notifications/stream?token=validQueryToken'
        };
        const result = await authMiddleware(req);
        expect(result.authorized).toBe(true);
        expect(result.user.id).toBe('u1');
        expect(verifyToken).toHaveBeenCalledWith('validQueryToken');
    });

    it('should return user if authorized with cookie token', async () => {
        verifyToken.mockResolvedValue({ id: 'u1' });
        User.findById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: { toString: () => 'u1' }, status: 'active' }) }) });
        const req = {
            headers: { get: (name) => name === 'cookie' ? 'token=validCookieToken; other=1' : null }
        };
        const result = await authMiddleware(req);
        expect(result.authorized).toBe(true);
        expect(result.user.id).toBe('u1');
        expect(verifyToken).toHaveBeenCalledWith('validCookieToken');
    });

    it('should handle thrown errors gracefully', async () => {
        verifyToken.mockRejectedValue(new Error('crash'));
        const result = await authMiddleware(createRequest('Bearer token'));
        expect(result).toEqual({ authorized: false, message: RESPONSE_MESSAGES.AUTH.AUTH_SERVICE_ERROR });
    });
});
