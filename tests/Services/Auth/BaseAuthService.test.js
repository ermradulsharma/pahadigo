import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Constants/index.js', () => ({
    RESPONSE_MESSAGES: {
        USER: { NOT_FOUND: 'User not found' },
        AUTH: { TOKEN_INVALID: 'Token invalid' },
        ERROR: { NOT_FOUND: 'Error not found' }
    },
    USER_ROLES: { VENDOR: 'vendor', TRAVELLER: 'traveller' },
    STATUS: { DELETED: 'deleted' },
    DEFAULTS: { NULL: null, TRUE: true }
}));

jest.unstable_mockModule('@/core/Models/User.js', () => ({
    default: {
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Models/Vendor.js', () => ({
    default: {
        findOne: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Helpers/jwt.js', () => ({
    verifyToken: jest.fn(),
    generateToken: jest.fn(),
    generateAuthTokens: jest.fn(),
    decodeToken: jest.fn()
}));

jest.unstable_mockModule('@/core/Helpers/geoUtils.js', () => ({
    mapToGeoJSON: jest.fn()
}));

jest.unstable_mockModule('@/core/Services/CacheService.js', () => ({
    default: {
        set: jest.fn(),
        get: jest.fn(),
        delete: jest.fn(),
        deletePattern: jest.fn()
    }
}));

const { default: BaseAuthService } = await import('@/core/Services/Auth/BaseAuthService.js');
const { default: User } = await import('@/core/Models/User.js');
const { default: Vendor } = await import('@/core/Models/Vendor.js');
const { verifyToken, generateAuthTokens, decodeToken } = await import('@/core/Helpers/jwt.js');
const { default: CacheService } = await import('@/core/Services/CacheService.js');
const { mapToGeoJSON } = await import('@/core/Helpers/geoUtils.js');

describe('BaseAuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateAndSaveTokens', () => {
        it('should generate tokens and save refresh token JTI in cache', async () => {
            const user = { _id: 'u1', role: 'vendor', email: 'test@test.com' };
            const tokens = { access: 'acc', refresh: 'ref', refreshJti: 'jti123' };
            generateAuthTokens.mockResolvedValue(tokens);
            
            const result = await BaseAuthService.generateAndSaveTokens(user, false);
            
            expect(generateAuthTokens).toHaveBeenCalledWith({ id: 'u1', role: 'vendor', email: 'test@test.com', identifier: 'test@test.com' }, false);
            expect(CacheService.set).toHaveBeenCalledWith('auth:refresh:u1:jti123', expect.any(Object), 7 * 24 * 60 * 60);
            expect(result).toBe(tokens);
        });
    });

    describe('verifyToken', () => {
        it('should verify token and return user', async () => {
            verifyToken.mockResolvedValue({ id: 'u1' });
            User.findById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'u1', role: 'traveller' }) }) });
            
            const result = await BaseAuthService.verifyToken('token');
            expect(result.user._id).toBe('u1');
        });

        it('should return vendor data if user is vendor', async () => {
            verifyToken.mockResolvedValue({ id: 'u1' });
            User.findById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'u1', role: 'vendor' }) }) });
            Vendor.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ businessName: 'Biz' }) });
            
            const result = await BaseAuthService.verifyToken('token');
            expect(result.businessProfile.businessName).toBe('Biz');
        });

        it('should throw if user not found', async () => {
            verifyToken.mockResolvedValue({ id: 'u1' });
            User.findById.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) });
            await expect(BaseAuthService.verifyToken('token')).rejects.toThrow('User not found');
        });
    });

    describe('refreshToken', () => {
        it('should throw if token invalid type or no jti', async () => {
            verifyToken.mockResolvedValue({ type: 'access' });
            await expect(BaseAuthService.refreshToken('token')).rejects.toThrow('Token invalid');
        });

        it('should throw if jti not in cache', async () => {
            verifyToken.mockResolvedValue({ id: 'u1', type: 'refresh', jti: 'jti123' });
            CacheService.get.mockResolvedValue(null);
            await expect(BaseAuthService.refreshToken('token')).rejects.toThrow('Token invalid');
        });

        it('should generate new tokens and delete old refresh token', async () => {
            verifyToken.mockResolvedValue({ id: 'u1', type: 'refresh', jti: 'jti123', role: 'traveller', email: 'test@test.com' });
            CacheService.get.mockResolvedValue(true);
            const newTokens = { access: 'new_acc', refresh: 'new_ref', refreshJti: 'new_jti' };
            generateAuthTokens.mockResolvedValue(newTokens);
            
            const result = await BaseAuthService.refreshToken('token');
            
            expect(generateAuthTokens).toHaveBeenCalledWith(expect.objectContaining({ id: 'u1' }), true);
            expect(CacheService.delete).toHaveBeenCalledWith('auth:refresh:u1:jti123');
            expect(result).toBe(newTokens);
        });
    });

    describe('logout', () => {
        it('should invalidate specific refresh token', async () => {
            decodeToken.mockImplementation(t => t === 'acc' ? { id: 'u1' } : { id: 'u1', jti: 'jti123' });
            const result = await BaseAuthService.logout('acc', 'ref');
            expect(CacheService.delete).toHaveBeenCalledWith('auth:refresh:u1:jti123');
            expect(result).toBe(true);
        });

        it('should invalidate all sessions if no refresh token provided', async () => {
            decodeToken.mockReturnValue({ id: 'u1' });
            const result = await BaseAuthService.logout('acc');
            expect(CacheService.deletePattern).toHaveBeenCalledWith('auth:refresh:u1:*');
            expect(result).toBe(true);
        });

        it('should return false if access token invalid', async () => {
            decodeToken.mockReturnValue(null);
            const result = await BaseAuthService.logout('acc');
            expect(result).toBe(false);
        });
    });

    describe('updateUserProfile', () => {
        it('should throw if user not found', async () => {
            User.findById.mockResolvedValue(null);
            await expect(BaseAuthService.updateUserProfile('u1', {})).rejects.toThrow('Error not found');
        });

        it('should strip forbidden fields', async () => {
            User.findById.mockResolvedValue({ _id: 'u1' });
            User.findByIdAndUpdate.mockResolvedValue({ _id: 'u1' });
            
            await BaseAuthService.updateUserProfile('u1', { name: 'Test', role: 'admin', status: 'active' });
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', { name: 'Test' }, expect.any(Object));
        });

        it('should handle address and mapToGeoJSON', async () => {
            User.findById.mockResolvedValue({ _id: 'u1' });
            User.findByIdAndUpdate.mockResolvedValue({ _id: 'u1' });
            
            await BaseAuthService.updateUserProfile('u1', { address: { city: 'Test' } });
            expect(mapToGeoJSON).toHaveBeenCalled();
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', { address: { city: 'Test' } }, expect.any(Object));
        });
    });

    describe('deactivateUserAccount', () => {
        it('should deactivate account', async () => {
            User.findByIdAndUpdate.mockResolvedValue({ _id: 'u1' });
            await BaseAuthService.deactivateUserAccount('u1', 'reason');
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', expect.objectContaining({ status: 'deleted', deletedReason: 'reason' }), expect.any(Object));
        });

        it('should throw if user not found', async () => {
            User.findByIdAndUpdate.mockResolvedValue(null);
            await expect(BaseAuthService.deactivateUserAccount('u1')).rejects.toThrow('Error not found');
        });
    });
});
